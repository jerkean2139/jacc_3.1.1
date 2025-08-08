#!/usr/bin/env python3
"""
Script to copy all tables from a development database to a production database.
This script will:
1. Get list of all tables from development database
2. For each table, truncate the production table and copy data from development
3. Handle foreign key constraints properly
"""

import psycopg2
import sys
from urllib.parse import urlparse
import argparse

def parse_db_url(url):
    """Parse a PostgreSQL URL into connection parameters."""
    parsed = urlparse(url)
    return {
        'host': parsed.hostname,
        'port': parsed.port or 5432,
        'database': parsed.path[1:],  # Remove leading '/'
        'user': parsed.username,
        'password': parsed.password
    }

def get_connection(db_url):
    """Create a database connection from URL."""
    params = parse_db_url(db_url)
    return psycopg2.connect(**params)

def get_all_tables(conn):
    """Get list of all user tables from the database."""
    with conn.cursor() as cur:
        cur.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        """)
        return [row[0] for row in cur.fetchall()]

def disable_triggers(conn):
    """Disable all triggers to avoid foreign key issues during copy."""
    with conn.cursor() as cur:
        cur.execute("SET session_replication_role = replica;")
        conn.commit()

def enable_triggers(conn):
    """Re-enable all triggers after copy is complete."""
    with conn.cursor() as cur:
        cur.execute("SET session_replication_role = DEFAULT;")
        conn.commit()

def copy_table(dev_conn, prod_conn, table_name):
    """Copy a single table from development to production."""
    print(f"Copying table: {table_name}")
    
    # Get column names to ensure proper ordering
    with dev_conn.cursor() as cur:
        cur.execute(f"""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = %s AND table_schema = 'public'
            ORDER BY ordinal_position;
        """, (table_name,))
        columns = [row[0] for row in cur.fetchall()]
    
    if not columns:
        print(f"  Warning: No columns found for table {table_name}")
        return
    
    column_list = ', '.join(f'"{col}"' for col in columns)
    
    try:
        # Truncate the production table
        with prod_conn.cursor() as prod_cur:
            prod_cur.execute(f'TRUNCATE TABLE "{table_name}" CASCADE;')
        
        # Copy data from development to production
        with dev_conn.cursor() as dev_cur:
            dev_cur.execute(f'SELECT {column_list} FROM "{table_name}";')
            
            # Use copy_from for better performance with large tables
            with prod_conn.cursor() as prod_cur:
                while True:
                    rows = dev_cur.fetchmany(1000)  # Process in batches
                    if not rows:
                        break
                    
                    # Insert batch
                    placeholders = ', '.join(['%s'] * len(columns))
                    insert_sql = f'INSERT INTO "{table_name}" ({column_list}) VALUES ({placeholders})'
                    prod_cur.executemany(insert_sql, rows)
        
        prod_conn.commit()
        print(f"  ✓ Successfully copied {table_name}")
        
    except Exception as e:
        prod_conn.rollback()
        print(f"  ✗ Error copying {table_name}: {e}")
        raise

def reset_sequences(prod_conn, tables):
    """Reset all sequence values to match the current max values in tables."""
    print("Resetting sequences...")
    with prod_conn.cursor() as cur:
        for table in tables:
            # Find sequences associated with this table
            cur.execute("""
                SELECT column_name, column_default
                FROM information_schema.columns
                WHERE table_name = %s 
                AND column_default LIKE 'nextval%%'
            """, (table,))
            
            for column_name, column_default in cur.fetchall():
                # Extract sequence name from default value
                sequence_name = column_default.split("'")[1]
                
                try:
                    # Reset sequence to current max value
                    cur.execute(f"""
                        SELECT setval('{sequence_name}', 
                            COALESCE((SELECT MAX("{column_name}") FROM "{table}"), 1)
                        );
                    """)
                    print(f"  ✓ Reset sequence {sequence_name}")
                except Exception as e:
                    print(f"  ✗ Error resetting sequence {sequence_name}: {e}")
        
        prod_conn.commit()

def main():
    parser = argparse.ArgumentParser(description='Copy all tables from development to production database')
    parser.add_argument('dev_url', help='Development database URL')
    parser.add_argument('prod_url', help='Production database URL')
    parser.add_argument('--dry-run', action='store_true', help='Show what would be copied without actually doing it')
    
    args = parser.parse_args()
    
    if not args.dry_run:
        response = input("This will OVERWRITE all data in the production database. Are you sure? (yes/no): ")
        if response.lower() != 'yes':
            print("Operation cancelled.")
            return
    
    try:
        # Connect to both databases
        print("Connecting to databases...")
        dev_conn = get_connection(args.dev_url)
        prod_conn = get_connection(args.prod_url)
        
        # Get list of tables
        print("Getting table list...")
        tables = get_all_tables(dev_conn)
        print(f"Found {len(tables)} tables: {', '.join(tables)}")
        
        if args.dry_run:
            print("DRY RUN - Would copy the following tables:")
            for table in tables:
                print(f"  - {table}")
            return
        
        # Disable triggers to avoid foreign key constraint issues
        print("Disabling triggers...")
        disable_triggers(prod_conn)
        
        try:
            # Copy each table
            for table in tables:
                copy_table(dev_conn, prod_conn, table)
            
            # Reset sequences
            reset_sequences(prod_conn, tables)
            
        finally:
            # Re-enable triggers
            print("Re-enabling triggers...")
            enable_triggers(prod_conn)
        
        print("✓ All tables copied successfully!")
        
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)
    
    finally:
        # Close connections
        try:
            dev_conn.close()
            prod_conn.close()
        except:
            pass

if __name__ == "__main__":
    main()

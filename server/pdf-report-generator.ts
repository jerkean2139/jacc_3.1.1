// MEMORY OPTIMIZATION: Disabled puppeteer (12MB)
// import puppeteer from 'puppeteer';
let puppeteer: any = null;
import { sendEmail } from './sendgrid';
import { db } from './db';
import { pdfReports } from '@shared/schema';

export interface ReportData {
  merchantProfile: {
    businessName: string;
    dba?: string;
    industry: string;
    monthlyVolume: number;
    averageTicket: number;
    transactionCount: number;
  };
  currentProcessor?: any;
  proposedProcessor: any;
  costs: {
    current?: any;
    proposed: any;
    savings?: any;
  };
  hardware?: any[];
  recommendations?: string[];
  analysisDate: string;
  agentName: string;
  agentEmail: string;
}

export class PDFReportGenerator {
  private brandColors = {
    primary: '#1e40af',
    secondary: '#3b82f6',
    accent: '#10b981',
    text: '#1f2937',
    lightGray: '#f3f4f6'
  };

  async generateComparisonReport(data: ReportData): Promise<Buffer> {
    const html = this.generateComparisonHTML(data);
    return await this.generatePDF(html, 'comparison');
  }

  async generateSavingsReport(data: ReportData): Promise<Buffer> {
    const html = this.generateSavingsHTML(data);
    return await this.generatePDF(html, 'savings');
  }

  async generateCompactProposal(data: any): Promise<Buffer> {
    const html = this.generateCompactProposalHTML(data);
    return await this.generatePDF(html, 'compact-proposal');
  }

  private generateCompactProposalHTML(data: any): string {
    // Extract personalization data with explicit debugging
    console.log('🔍 PDF Template Data Received:', {
      hasBusinessInfo: !!data.businessInfo,
      businessInfoName: data.businessInfo?.name,
      businessInfoContactName: data.businessInfo?.contactName,
      directName: data.name,
      directContactName: data.contactName
    });
    
    // Extract personalization data with guaranteed assignment
    const businessName = data.businessInfo?.name || data.name || 'Not Provided';
    const contactName = data.businessInfo?.contactName || data.contactName || 'Not Provided';
    const currentDate = new Date().toLocaleDateString();
    
    console.log('🔍 Final Template Variables:', { businessName, contactName });
    
    // Extract data for both processing options
    const currentProcessor = data.currentProcessing || {};
    const tracerPay = data.tracerPayProcessing || {};
    const passItThrough = data.passItThroughProcessing || {};
    const savings = data.savings || {};
    const businessInfo = data.businessInfo || {};
    
    // Create HTML template with placeholders
    let htmlContent = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Processing Proposal - BUSINESS_NAME_PLACEHOLDER</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            @page {
                size: A4;
                margin: 6mm 5mm;
            }
            
            body {
                font-family: 'Segoe UI', Arial, sans-serif;
                font-size: 8px;
                line-height: 1.1;
                color: #1f2937;
                background: white;
            }
            
            .header {
                background: linear-gradient(135deg, #2563eb, #1e40af);
                color: white;
                padding: 8px;
                border-radius: 4px;
                text-align: center;
                margin-bottom: 8px;
            }
            
            .header h1 {
                font-size: 14px;
                margin-bottom: 4px;
            }
            
            .header-info {
                display: flex;
                justify-content: space-between;
                font-size: 8px;
                margin-top: 4px;
            }
            
            .content {
                display: grid;
                gap: 6px;
            }
            
            .section {
                border: 1px solid #e5e7eb;
                border-radius: 3px;
                padding: 6px;
                background: #f9fafb;
            }
            
            .section h2 {
                color: #2563eb;
                font-size: 10px;
                margin-bottom: 4px;
                border-bottom: 1px solid #e5e7eb;
                padding-bottom: 2px;
            }
            
            .comparison-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 15px;
            }
            
            .cost-box {
                background: white;
                border: 1px solid #d1d5db;
                border-radius: 6px;
                padding: 12px;
            }
            
            .cost-box h3 {
                font-size: 13px;
                color: #374151;
                margin-bottom: 8px;
            }
            
            .cost-item {
                display: flex;
                justify-content: space-between;
                margin: 4px 0;
                font-size: 11px;
            }
            
            .cost-total {
                font-weight: bold;
                border-top: 1px solid #e5e7eb;
                padding-top: 4px;
                margin-top: 8px;
            }
            
            .savings-highlight {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 15px;
                border-radius: 6px;
                text-align: center;
            }
            
            .savings-highlight h3 {
                font-size: 16px;
                margin-bottom: 8px;
            }
            
            .savings-amount {
                font-size: 20px;
                font-weight: bold;
                margin: 5px 0;
            }
            
            .footer {
                background: #1f2937;
                color: white;
                padding: 6px;
                text-align: center;
                font-size: 8px;
                border-radius: 3px;
                margin-top: 8px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Payment Processing Proposal</h1>
            <div class="header-info">
                <div><strong>Company:</strong> BUSINESS_NAME_PLACEHOLDER</div>
                <div><strong>Contact:</strong> CONTACT_NAME_PLACEHOLDER</div>
                <div><strong>Date:</strong> CURRENT_DATE_PLACEHOLDER</div>
            </div>
        </div>

        <div class="content">
            <div class="section">
                <h2>Business Overview</h2>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 4px; font-size: 8px;">
                    <div><strong>Business Type:</strong> ${data.businessInfo?.type || 'Restaurant'}</div>
                    <div><strong>Monthly Volume:</strong> $${(data.businessInfo?.monthlyVolume || 50000).toLocaleString()}</div>
                    <div><strong>Average Ticket:</strong> $${data.businessInfo?.averageTicket || 45}</div>
                    <div><strong>Transaction Count:</strong> ~${Math.round((data.businessInfo?.monthlyVolume || 50000) / (data.businessInfo?.averageTicket || 45))}</div>
                </div>
            </div>

            <div class="section">
                <h2>Current Processing Costs</h2>
                <div class="cost-box">
                    <div class="cost-item">
                        <span>Processing Rate:</span>
                        <span>${(currentProcessor.rate || 2.9).toFixed(2)}%</span>
                    </div>
                    <div class="cost-item">
                        <span>Monthly Fee:</span>
                        <span>$${(currentProcessor.monthlyFee || 25).toFixed(2)}</span>
                    </div>
                    <div class="cost-item cost-total" style="color: #dc2626;">
                        <span>Total Monthly Cost:</span>
                        <span>$${(currentProcessor.totalCost || 1500).toFixed(2)}</span>
                    </div>
                    <div class="cost-item">
                        <span>Effective Rate:</span>
                        <span>${(currentProcessor.effectiveRate || 3.0).toFixed(2)}%</span>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Processing Solutions Comparison</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 8px; margin-top: 4px;">
                    <thead>
                        <tr style="background: #f3f4f6;">
                            <th style="border: 1px solid #d1d5db; padding: 4px; text-align: left; font-weight: bold;">Fee Structure</th>
                            <th style="border: 1px solid #d1d5db; padding: 4px; text-align: center; background: #eff6ff; color: #2563eb; font-weight: bold;">TracerPay Solution</th>
                            <th style="border: 1px solid #d1d5db; padding: 4px; text-align: center; background: #f0fdf4; color: #059669; font-weight: bold;">Pass It Through Solution</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #f9fafb; font-weight: bold;">Processing Rate</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">${(tracerPay.rate || 3.25).toFixed(2)}%</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">0.00% (Customer pays)</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #f9fafb; font-weight: bold;">Customer Surcharge</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">N/A</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">${(passItThrough.customerSurcharge || 3.25).toFixed(2)}%</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #f9fafb; font-weight: bold;">Monthly Fee</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">$${(tracerPay.monthlyFee || 25).toFixed(2)}</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">$${(passItThrough.monthlyFee || 25).toFixed(2)}</td>
                        </tr>
                        <tr>
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #f9fafb; font-weight: bold;">Authorization Fees</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">$0.10 per transaction</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center;">$0.10 per transaction</td>
                        </tr>
                        <tr style="background: #f8fafc;">
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #e5e7eb; font-weight: bold; color: #1f2937;">Total Monthly Cost</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center; font-weight: bold; color: #2563eb;">$${(tracerPay.totalCost || 1800).toFixed(2)}</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center; font-weight: bold; color: #059669;">$${(passItThrough.merchantCost || 25).toFixed(2)}</td>
                        </tr>
                        <tr style="background: #f8fafc;">
                            <td style="border: 1px solid #d1d5db; padding: 4px; background: #e5e7eb; font-weight: bold; color: #1f2937;">Effective Rate</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center; font-weight: bold; color: #2563eb;">${(tracerPay.effectiveRate || 3.6).toFixed(2)}%</td>
                            <td style="border: 1px solid #d1d5db; padding: 4px; text-align: center; font-weight: bold; color: #059669;">${(passItThrough.effectiveRate || 0.05).toFixed(2)}%</td>
                        </tr>
                    </tbody>
                </table>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-top: 8px;">
                    <div style="background: #eff6ff; border: 1px solid #3b82f6; border-radius: 4px; padding: 6px;">
                        <h4 style="color: #2563eb; margin: 0 0 4px 0; font-size: 9px;">TracerPay Benefits</h4>
                        <ul style="margin: 0; padding-left: 12px; font-size: 8px; line-height: 1.3;">
                            <li>Competitive 3.25% processing rate</li>
                            <li>Transparent pricing structure</li>
                            <li>24/7 customer support</li>
                        </ul>
                    </div>
                    <div style="background: #f0fdf4; border: 1px solid #10b981; border-radius: 4px; padding: 6px;">
                        <h4 style="color: #059669; margin: 0 0 4px 0; font-size: 9px;">Pass It Through Benefits</h4>
                        <ul style="margin: 0; padding-left: 12px; font-size: 8px; line-height: 1.3;">
                            <li>Zero processing fees for merchant</li>
                            <li>Customer pays their own processing</li>
                            <li>Maximum cost savings</li>
                        </ul>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Savings Comparison</h2>
                <div class="comparison-grid">
                    <div style="background: linear-gradient(135deg, #2563eb, #1e40af); color: white; padding: 8px; border-radius: 4px; text-align: center;">
                        <h3 style="margin-bottom: 4px; font-size: 10px;">TracerPay Savings</h3>
                        <div style="font-size: 12px; font-weight: bold;">$${Math.abs(savings.tracerPayMonthlySavings || 0).toFixed(2)} per month</div>
                        <div style="font-size: 10px;">$${Math.abs(savings.tracerPayAnnualSavings || 0).toFixed(2)} annually</div>
                    </div>
                    
                    <div style="background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 8px; border-radius: 4px; text-align: center;">
                        <h3 style="margin-bottom: 4px; font-size: 10px;">Pass It Through Savings</h3>
                        <div style="font-size: 12px; font-weight: bold;">$${Math.abs(savings.passItThroughMonthlySavings || 0).toFixed(2)} per month</div>
                        <div style="font-size: 10px;">$${Math.abs(savings.passItThroughAnnualSavings || 0).toFixed(2)} annually</div>
                    </div>
                </div>
            </div>

            <div class="section">
                <h2>Solution Options & Next Steps</h2>
                <div style="font-size: 9px; line-height: 1.4;">
                    <div style="margin-bottom: 6px;"><strong>Choose Your Processing Solution:</strong></div>
                    <div style="margin: 4px 0; padding-left: 10px;"><strong>Option A - TracerPay:</strong> Competitive 3.25% rate with transparent pricing</div>
                    <div style="margin: 4px 0; padding-left: 10px;"><strong>Option B - Pass It Through:</strong> Zero processing fees (customer pays 3.25% surcharge)</div>
                    <div style="margin-top: 8px; margin-bottom: 4px;"><strong>Implementation Process:</strong></div>
                    <div style="margin: 3px 0; padding-left: 10px;">• Review and select preferred solution</div>
                    <div style="margin: 3px 0; padding-left: 10px;">• Complete merchant application with required documentation</div>
                    <div style="margin: 3px 0; padding-left: 10px;">• Schedule equipment installation (1-3 business days)</div>
                    <div style="margin: 3px 0; padding-left: 10px;">• Begin processing with chosen solution</div>
                </div>
            </div>
        </div>

        <div class="footer">
            <div><strong>JACC - Merchant Services Intelligence Platform</strong></div>
            <div>Professional payment processing analysis and optimization</div>
        </div>
    </body>
    </html>`;
    
    // Replace placeholders with actual values using explicit string replacement
    console.log('🔍 BEFORE replacement - checking placeholders exist:', {
      businessPlaceholder: htmlContent.includes('BUSINESS_NAME_PLACEHOLDER'),
      contactPlaceholder: htmlContent.includes('CONTACT_NAME_PLACEHOLDER'),
      datePlaceholder: htmlContent.includes('CURRENT_DATE_PLACEHOLDER')
    });
    
    htmlContent = htmlContent.replace(/BUSINESS_NAME_PLACEHOLDER/g, businessName);
    htmlContent = htmlContent.replace(/CONTACT_NAME_PLACEHOLDER/g, contactName);
    htmlContent = htmlContent.replace(/CURRENT_DATE_PLACEHOLDER/g, currentDate);
    
    console.log('🔍 AFTER replacement - verifying placeholders gone:', {
      businessPlaceholder: htmlContent.includes('BUSINESS_NAME_PLACEHOLDER'),
      contactPlaceholder: htmlContent.includes('CONTACT_NAME_PLACEHOLDER'),
      datePlaceholder: htmlContent.includes('CURRENT_DATE_PLACEHOLDER')
    });
    
    console.log('🔍 Final HTML header preview with replacements:', htmlContent.substring(htmlContent.indexOf('<div class="header-info">'), htmlContent.indexOf('</div>') + 6));
    console.log('🔍 Values used for replacement:', { businessName, contactName, currentDate });
    
    return htmlContent;
  }

  async generateProposalReport(data: ReportData): Promise<Buffer> {
    const html = this.generateProposalHTML(data);
    return await this.generatePDF(html, 'proposal');
  }

  private generateComparisonHTML(data: ReportData): string {
    const { merchantProfile, currentProcessor, proposedProcessor, costs, hardware, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Merchant Services Comparison Report</title>
        <style>
            ${this.getBaseCSS()}
            
            .comparison-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
            }
            
            .processor-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 25px;
                background: #f9fafb;
            }
            
            .processor-card.current {
                border-color: #ef4444;
                background: #fef2f2;
            }
            
            .processor-card.proposed {
                border-color: #10b981;
                background: #f0fdf4;
            }
            
            .cost-item {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            
            .savings-highlight {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 20px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Processor Comparison Report', analysisDate, agentName)}
        
        <div class="content">
            <section class="merchant-info">
                <h2>Business Overview</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Business Name:</strong> ${merchantProfile.businessName}
                        ${merchantProfile.dba ? `<br><strong>DBA:</strong> ${merchantProfile.dba}` : ''}
                    </div>
                    <div class="info-item">
                        <strong>Industry:</strong> ${merchantProfile.industry}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}
                    </div>
                    <div class="info-item">
                        <strong>Average Ticket:</strong> $${merchantProfile.averageTicket.toFixed(2)}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Transactions:</strong> ${merchantProfile.transactionCount.toLocaleString()}
                    </div>
                </div>
            </section>

            ${costs.savings ? `
            <div class="savings-highlight">
                <h2 style="margin: 0 0 10px 0;">Potential Monthly Savings</h2>
                <div style="font-size: 48px; font-weight: bold;">$${Math.abs(costs.savings.monthly).toFixed(2)}</div>
                <div style="font-size: 18px; opacity: 0.9;">Annual Savings: $${Math.abs(costs.savings.annual).toFixed(0)}</div>
            </div>
            ` : ''}

            <section class="comparison-section">
                <h2>Processor Comparison</h2>
                <div class="comparison-grid">
                    ${currentProcessor ? `
                    <div class="processor-card current">
                        <h3>Current Processor</h3>
                        <h4>${currentProcessor.name}</h4>
                        <div class="cost-breakdown">
                            <div class="cost-item">
                                <span>Monthly Cost:</span>
                                <strong>$${costs.current.totalMonthlyCost.toFixed(2)}</strong>
                            </div>
                            <div class="cost-item">
                                <span>Effective Rate:</span>
                                <strong>${(costs.current.effectiveRate * 100).toFixed(2)}%</strong>
                            </div>
                            <div class="cost-item">
                                <span>Annual Cost:</span>
                                <strong>$${costs.current.annualCost.toFixed(0)}</strong>
                            </div>
                        </div>
                    </div>
                    ` : ''}
                    
                    <div class="processor-card proposed">
                        <h3>Proposed Processor</h3>
                        <h4>${proposedProcessor.name}</h4>
                        <div class="cost-breakdown">
                            <div class="cost-item">
                                <span>Monthly Cost:</span>
                                <strong>$${costs.proposed.totalMonthlyCost.toFixed(2)}</strong>
                            </div>
                            <div class="cost-item">
                                <span>Effective Rate:</span>
                                <strong>${(costs.proposed.effectiveRate * 100).toFixed(2)}%</strong>
                            </div>
                            <div class="cost-item">
                                <span>Annual Cost:</span>
                                <strong>$${costs.proposed.annualCost.toFixed(0)}</strong>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            ${hardware && hardware.length > 0 ? `
            <section class="hardware-section">
                <h2>Recommended Hardware</h2>
                <div class="hardware-grid">
                    ${hardware.map(item => `
                    <div class="hardware-item">
                        <h4>${item.name}</h4>
                        <p><strong>Manufacturer:</strong> ${item.manufacturer}</p>
                        <p><strong>Model:</strong> ${item.model}</p>
                        <p><strong>Monthly Lease:</strong> $${(item.monthlyLease || 0).toFixed(2)}</p>
                        <p><strong>Purchase Price:</strong> $${item.price.toFixed(2)}</p>
                    </div>
                    `).join('')}
                </div>
            </section>
            ` : ''}

            ${data.recommendations && data.recommendations.length > 0 ? `
            <section class="recommendations">
                <h2>Recommendations</h2>
                <ul>
                    ${data.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                </ul>
            </section>
            ` : ''}
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private generateSavingsHTML(data: ReportData): string {
    const { merchantProfile, costs, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Savings Analysis Report</title>
        <style>
            ${this.getBaseCSS()}
            
            .savings-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .metric-card {
                background: linear-gradient(135deg, #f0fdf4, #dcfce7);
                border: 2px solid #10b981;
                border-radius: 12px;
                padding: 20px;
                text-align: center;
            }
            
            .metric-value {
                font-size: 32px;
                font-weight: bold;
                color: #059669;
                margin: 10px 0;
            }
            
            .metric-label {
                font-size: 14px;
                color: #374151;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Savings Analysis Report', analysisDate, agentName)}
        
        <div class="content">
            <section class="merchant-info">
                <h2>Business Profile</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Business:</strong> ${merchantProfile.businessName}
                    </div>
                    <div class="info-item">
                        <strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}
                    </div>
                    <div class="info-item">
                        <strong>Industry:</strong> ${merchantProfile.industry}
                    </div>
                </div>
            </section>

            <section class="savings-analysis">
                <h2>Savings Analysis</h2>
                <div class="savings-dashboard">
                    <div class="metric-card">
                        <div class="metric-label">Monthly Savings</div>
                        <div class="metric-value">$${Math.abs(costs.savings.monthly).toFixed(2)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Annual Savings</div>
                        <div class="metric-value">$${Math.abs(costs.savings.annual).toFixed(0)}</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">Payback Period</div>
                        <div class="metric-value">${costs.savings.paybackPeriod.toFixed(1)}</div>
                        <div style="font-size: 12px; color: #6b7280;">months</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-label">ROI</div>
                        <div class="metric-value">${costs.savings.roi.toFixed(0)}%</div>
                    </div>
                </div>
            </section>

            ${costs.savings.breakdownAnalysis ? `
            <section class="breakdown-analysis">
                <h2>Cost Breakdown Analysis</h2>
                <div class="breakdown-grid">
                    <div class="breakdown-item">
                        <h4>Processing Cost Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.processingCostSavings).toFixed(2)}</div>
                    </div>
                    <div class="breakdown-item">
                        <h4>Monthly Fee Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.feeSavings).toFixed(2)}</div>
                    </div>
                    <div class="breakdown-item">
                        <h4>Equipment Savings</h4>
                        <div class="breakdown-value">$${Math.abs(costs.savings.breakdownAnalysis.equipmentSavings).toFixed(2)}</div>
                    </div>
                </div>
            </section>
            ` : ''}
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private generateProposalHTML(data: ReportData): string {
    const { merchantProfile, proposedProcessor, costs, hardware, analysisDate, agentName } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Merchant Services Proposal</title>
        <style>
            ${this.getBaseCSS()}
            
            .proposal-header {
                background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
                color: white;
                padding: 40px;
                border-radius: 12px;
                text-align: center;
                margin: 30px 0;
            }
            
            .proposal-sections {
                display: grid;
                gap: 30px;
            }
            
            .section {
                background: #f9fafb;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 30px;
            }
        </style>
    </head>
    <body>
        ${this.getHeaderHTML(merchantProfile.businessName, 'Merchant Services Proposal', analysisDate, agentName)}
        
        <div class="content">
            <div class="proposal-header">
                <h1>Merchant Services Proposal</h1>
                <p style="font-size: 18px; margin: 20px 0 0 0;">
                    Customized payment processing solution for ${merchantProfile.businessName}
                </p>
            </div>

            <div class="proposal-sections">
                <section class="section">
                    <h2>Executive Summary</h2>
                    <p>This proposal outlines a comprehensive payment processing solution for ${merchantProfile.businessName}, 
                    designed to optimize costs and improve operational efficiency. Our recommended ${proposedProcessor.name} 
                    solution offers competitive rates and modern payment acceptance capabilities.</p>
                    
                    <div class="summary-metrics">
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-top: 20px;">
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: ${this.brandColors.primary};">
                                    $${costs.proposed.totalMonthlyCost.toFixed(2)}
                                </div>
                                <div style="font-size: 12px; color: #6b7280;">Monthly Cost</div>
                            </div>
                            <div style="text-align: center; padding: 15px; background: white; border-radius: 8px;">
                                <div style="font-size: 24px; font-weight: bold; color: ${this.brandColors.primary};">
                                    ${(costs.proposed.effectiveRate * 100).toFixed(2)}%
                                </div>
                                <div style="font-size: 12px; color: #6b7280;">Effective Rate</div>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Pricing Breakdown</h2>
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr style="background: #f3f4f6;">
                            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e5e7eb;">Component</th>
                            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e5e7eb;">Cost</th>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Processing Costs</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyProcessingCosts.toFixed(2)}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Monthly Fees</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyFees.toFixed(2)}
                            </td>
                        </tr>
                        ${costs.proposed.monthlyEquipment > 0 ? `
                        <tr>
                            <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">Equipment Lease</td>
                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #e5e7eb;">
                                $${costs.proposed.monthlyEquipment.toFixed(2)}
                            </td>
                        </tr>
                        ` : ''}
                        <tr style="background: #f3f4f6; font-weight: bold;">
                            <td style="padding: 12px; border-top: 2px solid #e5e7eb;">Total Monthly Cost</td>
                            <td style="padding: 12px; text-align: right; border-top: 2px solid #e5e7eb;">
                                $${costs.proposed.totalMonthlyCost.toFixed(2)}
                            </td>
                        </tr>
                    </table>
                </section>

                ${hardware && hardware.length > 0 ? `
                <section class="section">
                    <h2>Equipment Recommendations</h2>
                    <div style="display: grid; gap: 20px;">
                        ${hardware.map(item => `
                        <div style="border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; background: white;">
                            <h4 style="margin: 0 0 10px 0; color: ${this.brandColors.primary};">${item.name}</h4>
                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; font-size: 14px;">
                                <div><strong>Manufacturer:</strong> ${item.manufacturer}</div>
                                <div><strong>Model:</strong> ${item.model}</div>
                                <div><strong>Monthly Lease:</strong> $${(item.monthlyLease || 0).toFixed(2)}</div>
                                <div><strong>Purchase Price:</strong> $${item.price.toFixed(2)}</div>
                            </div>
                            ${item.features && item.features.length > 0 ? `
                            <div style="margin-top: 15px;">
                                <strong>Features:</strong> ${item.features.join(', ')}
                            </div>
                            ` : ''}
                        </div>
                        `).join('')}
                    </div>
                </section>
                ` : ''}

                <section class="section">
                    <h2>Implementation Timeline</h2>
                    <div style="display: grid; gap: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">1</div>
                            <div>
                                <strong>Application Submission</strong><br>
                                <span style="color: #6b7280;">Complete merchant application and documentation review (1-2 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">2</div>
                            <div>
                                <strong>Underwriting & Approval</strong><br>
                                <span style="color: #6b7280;">Risk assessment and account approval process (2-5 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.primary}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">3</div>
                            <div>
                                <strong>Equipment Setup</strong><br>
                                <span style="color: #6b7280;">Hardware delivery, installation, and testing (1-3 business days)</span>
                            </div>
                        </div>
                        <div style="display: flex; align-items: center; gap: 15px;">
                            <div style="width: 30px; height: 30px; background: ${this.brandColors.accent}; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold;">✓</div>
                            <div>
                                <strong>Go Live</strong><br>
                                <span style="color: #6b7280;">Begin processing transactions with new system</span>
                            </div>
                        </div>
                    </div>
                </section>

                <section class="section">
                    <h2>Next Steps</h2>
                    <ol style="line-height: 1.8;">
                        <li>Review and approve this proposal</li>
                        <li>Complete merchant application with required documentation</li>
                        <li>Schedule equipment installation appointment</li>
                        <li>Coordinate with current processor for transition timeline</li>
                        <li>Begin processing with optimized payment solution</li>
                    </ol>
                </section>
            </div>
        </div>

        ${this.getFooterHTML()}
    </body>
    </html>
    `;
  }

  private getBaseCSS(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: ${this.brandColors.text};
            background: white;
        }
        
        .header {
            background: linear-gradient(135deg, ${this.brandColors.primary}, ${this.brandColors.secondary});
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 32px;
            margin-bottom: 10px;
        }
        
        .header-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-top: 20px;
            flex-wrap: wrap;
            gap: 20px;
        }
        
        .content {
            padding: 40px;
            max-width: 1200px;
            margin: 0 auto;
        }
        
        h2 {
            color: ${this.brandColors.primary};
            margin: 30px 0 20px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid ${this.brandColors.lightGray};
        }
        
        h3, h4 {
            color: ${this.brandColors.primary};
            margin: 20px 0 10px 0;
        }
        
        .info-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .info-item {
            background: ${this.brandColors.lightGray};
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid ${this.brandColors.primary};
        }
        
        .hardware-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
        }
        
        .hardware-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
        }
        
        .breakdown-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .breakdown-item {
            background: white;
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        
        .breakdown-value {
            font-size: 24px;
            font-weight: bold;
            color: ${this.brandColors.accent};
            margin-top: 10px;
        }
        
        .recommendations ul {
            list-style-type: none;
            padding: 0;
        }
        
        .recommendations li {
            background: ${this.brandColors.lightGray};
            padding: 15px;
            margin: 10px 0;
            border-radius: 8px;
            border-left: 4px solid ${this.brandColors.accent};
        }
        
        .footer {
            background: ${this.brandColors.text};
            color: white;
            padding: 30px;
            text-align: center;
            font-size: 14px;
        }
        
        .footer-content {
            max-width: 1200px;
            margin: 0 auto;
        }
        
        @media print {
            .header, .footer {
                background: ${this.brandColors.primary} !important;
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
            }
        }
    `;
  }

  private getHeaderHTML(businessName: string, reportType: string, date: string, agentName: string): string {
    return `
        <div class="header">
            <h1>${reportType}</h1>
            <div class="header-info">
                <div>
                    <strong>Business:</strong> ${businessName}
                </div>
                <div>
                    <strong>Date:</strong> ${date}
                </div>
                <div>
                    <strong>Prepared by:</strong> ${agentName}
                </div>
            </div>
        </div>
    `;
  }

  private getFooterHTML(): string {
    return `
        <div class="footer">
            <div class="footer-content">
                <p><strong>JACC - Merchant Services Intelligence Platform</strong></p>
                <p>Professional payment processing analysis and optimization</p>
                <p style="margin-top: 15px; opacity: 0.8;">
                    This report contains confidential and proprietary information. 
                    Distribution is restricted to authorized personnel only.
                </p>
            </div>
        </div>
    `;
  }

  private async generatePDF(html: string, reportType: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-extensions',
        '--disable-plugins',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
        '--single-process',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        }
      });

      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  async saveAndEmailReport(
    reportData: ReportData, 
    reportType: 'comparison' | 'savings' | 'proposal',
    recipientEmail: string,
    generatedBy: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      // Generate PDF
      let pdfBuffer: Buffer;
      let subject: string;
      
      switch (reportType) {
        case 'comparison':
          pdfBuffer = await this.generateComparisonReport(reportData);
          subject = `Processor Comparison Report - ${reportData.merchantProfile.businessName}`;
          break;
        case 'savings':
          pdfBuffer = await this.generateSavingsReport(reportData);
          subject = `Savings Analysis Report - ${reportData.merchantProfile.businessName}`;
          break;
        case 'proposal':
          pdfBuffer = await this.generateProposalReport(reportData);
          subject = `Merchant Services Proposal - ${reportData.merchantProfile.businessName}`;
          break;
      }

      // Save report record to database
      const [reportRecord] = await db.insert(pdfReports).values({
        reportType,
        merchantName: reportData.merchantProfile.businessName,
        processorName: reportData.proposedProcessor.name,
        generatedBy,
        emailRecipient: recipientEmail,
        reportData: reportData as any
      }).returning();

      // Send email with PDF attachment
      const emailContent = this.generateEmailContent(reportData, reportType);
      
      const emailSent = await sendEmail(process.env.SENDGRID_API_KEY!, {
        to: recipientEmail,
        from: reportData.agentEmail,
        subject,
        html: emailContent,
        attachments: [{
          content: pdfBuffer.toString('base64'),
          filename: `${reportType}-report-${reportData.merchantProfile.businessName.replace(/\s+/g, '-')}.pdf`,
          type: 'application/pdf',
          disposition: 'attachment'
        }]
      });

      // Update email sent status
      if (emailSent) {
        await db.update(pdfReports)
          .set({ emailSent: true })
          .where(eq(pdfReports.id, reportRecord.id));
      }

      return {
        success: emailSent,
        reportId: reportRecord.id,
        error: emailSent ? undefined : 'Failed to send email'
      };

    } catch (error) {
      console.error('Error saving and emailing report:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  private generateEmailContent(data: ReportData, reportType: string): string {
    const { merchantProfile, agentName } = data;
    
    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #1e40af, #3b82f6); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0;">Merchant Services ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</h1>
        </div>
        
        <div style="padding: 30px; background: #f9fafb;">
            <p>Dear Team,</p>
            
            <p>Please find attached the ${reportType} report for <strong>${merchantProfile.businessName}</strong>.</p>
            
            <div style="background: white; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0;">
                <h3 style="margin: 0 0 10px 0; color: #1e40af;">Report Summary</h3>
                <ul style="margin: 0; padding-left: 20px;">
                    <li><strong>Business:</strong> ${merchantProfile.businessName}</li>
                    <li><strong>Monthly Volume:</strong> $${merchantProfile.monthlyVolume.toLocaleString()}</li>
                    <li><strong>Industry:</strong> ${merchantProfile.industry}</li>
                    <li><strong>Report Type:</strong> ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Analysis</li>
                </ul>
            </div>
            
            <p>This comprehensive analysis provides detailed insights into payment processing options and potential cost savings opportunities.</p>
            
            <p>If you have any questions about this report, please don't hesitate to reach out.</p>
            
            <p>Best regards,<br>
            <strong>${agentName}</strong><br>
            JACC Merchant Services</p>
        </div>
        
        <div style="background: #1f2937; color: white; padding: 20px; text-align: center; font-size: 14px;">
            <p style="margin: 0;"><strong>JACC - Merchant Services Intelligence Platform</strong></p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">Professional payment processing analysis and optimization</p>
        </div>
    </div>
    `;
  }
}

export const pdfReportGenerator = new PDFReportGenerator();

// Simple PDF generation function for basic calculation reports
export async function generatePDFReport(calculationData: any): Promise<Buffer> {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Payment Processing Proposal</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                margin: 0;
                padding: 40px;
                background: #ffffff;
                color: #1f2937;
                line-height: 1.6;
            }
            .header {
                text-align: center;
                margin-bottom: 40px;
                border-bottom: 3px solid #1e40af;
                padding-bottom: 20px;
            }
            .header h1 {
                color: #1e40af;
                font-size: 28px;
                margin: 0;
                font-weight: 700;
            }
            .header p {
                color: #6b7280;
                font-size: 16px;
                margin: 10px 0 0 0;
            }
            .business-info {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 8px;
                padding: 25px;
                margin-bottom: 30px;
            }
            .business-info h2 {
                color: #1e40af;
                margin: 0 0 15px 0;
                font-size: 20px;
            }
            .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
            }
            .info-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .info-label {
                font-weight: 600;
                color: #374151;
            }
            .info-value {
                color: #1f2937;
                font-weight: 500;
            }
            .comparison-section {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 30px;
                margin: 30px 0;
            }
            .processor-card {
                border: 2px solid #e5e7eb;
                border-radius: 12px;
                padding: 25px;
                background: #ffffff;
            }
            .processor-card.current {
                border-color: #ef4444;
                background: #fef2f2;
            }
            .processor-card.recommended {
                border-color: #10b981;
                background: #f0fdf4;
            }
            .processor-card h3 {
                margin: 0 0 15px 0;
                font-size: 18px;
                font-weight: 700;
            }
            .processor-card.current h3 {
                color: #dc2626;
            }
            .processor-card.recommended h3 {
                color: #059669;
            }
            .cost-item {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e5e7eb;
            }
            .cost-label {
                font-weight: 500;
                color: #374151;
            }
            .cost-value {
                font-weight: 600;
                color: #1f2937;
            }
            .savings-highlight {
                background: linear-gradient(135deg, #10b981, #059669);
                color: white;
                padding: 25px;
                border-radius: 12px;
                margin: 30px 0;
                text-align: center;
            }
            .savings-highlight h2 {
                margin: 0 0 15px 0;
                font-size: 24px;
                font-weight: 700;
            }
            .savings-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 20px;
            }
            .savings-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 8px;
                text-align: center;
            }
            .savings-amount {
                font-size: 20px;
                font-weight: 700;
                margin: 0;
            }
            .savings-label {
                font-size: 14px;
                opacity: 0.9;
                margin: 5px 0 0 0;
            }
            .footer {
                margin-top: 40px;
                text-align: center;
                padding: 20px;
                border-top: 1px solid #e5e7eb;
                color: #6b7280;
                font-size: 14px;
            }
            .footer strong {
                color: #1e40af;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Payment Processing Proposal</h1>
            <p>Comprehensive Rate Analysis & Savings Calculation</p>
        </div>

        <div class="business-info">
            <h2>Business Information</h2>
            <div class="info-grid">
                <div class="info-item">
                    <span class="info-label">Business Name:</span>
                    <span class="info-value">${calculationData.businessInfo.name}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Business Type:</span>
                    <span class="info-value">${calculationData.businessInfo.type}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Monthly Volume:</span>
                    <span class="info-value">$${calculationData.businessInfo.monthlyVolume.toLocaleString()}</span>
                </div>
                <div class="info-item">
                    <span class="info-label">Average Ticket:</span>
                    <span class="info-value">$${calculationData.businessInfo.averageTicket}</span>
                </div>
            </div>
        </div>

        <div class="comparison-section">
            <div class="processor-card current">
                <h3>Current Processing</h3>
                <div class="cost-item">
                    <span class="cost-label">Processor:</span>
                    <span class="cost-value">${calculationData.currentProcessing.processor}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Interchange Rate:</span>
                    <span class="cost-value">${(calculationData.currentProcessing.interchangeRate * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Assessment Fee:</span>
                    <span class="cost-value">${(calculationData.currentProcessing.assessmentFee * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Processing Fee:</span>
                    <span class="cost-value">${(calculationData.currentProcessing.processingFee * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Monthly Fee:</span>
                    <span class="cost-value">$${calculationData.currentProcessing.monthlyFee}</span>
                </div>
                <div class="cost-item" style="border-bottom: 2px solid #ef4444; padding-top: 15px;">
                    <span class="cost-label"><strong>Total Monthly Cost:</strong></span>
                    <span class="cost-value"><strong>$${calculationData.currentProcessing.totalCost}</strong></span>
                </div>
            </div>

            <div class="processor-card recommended">
                <h3>Recommended Processing</h3>
                <div class="cost-item">
                    <span class="cost-label">Processor:</span>
                    <span class="cost-value">${calculationData.recommendedProcessing.processor}</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Interchange Rate:</span>
                    <span class="cost-value">${(calculationData.recommendedProcessing.interchangeRate * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Assessment Fee:</span>
                    <span class="cost-value">${(calculationData.recommendedProcessing.assessmentFee * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Processing Fee:</span>
                    <span class="cost-value">${(calculationData.recommendedProcessing.processingFee * 100).toFixed(2)}%</span>
                </div>
                <div class="cost-item">
                    <span class="cost-label">Monthly Fee:</span>
                    <span class="cost-value">$${calculationData.recommendedProcessing.monthlyFee}</span>
                </div>
                <div class="cost-item" style="border-bottom: 2px solid #10b981; padding-top: 15px;">
                    <span class="cost-label"><strong>Total Monthly Cost:</strong></span>
                    <span class="cost-value"><strong>$${calculationData.recommendedProcessing.totalCost}</strong></span>
                </div>
            </div>
        </div>

        <div class="savings-highlight">
            <h2>Your Savings Opportunity</h2>
            <div class="savings-grid">
                <div class="savings-item">
                    <p class="savings-amount">$${calculationData.savings.monthlySavings}</p>
                    <p class="savings-label">Monthly Savings</p>
                </div>
                <div class="savings-item">
                    <p class="savings-amount">$${calculationData.savings.annualSavings}</p>
                    <p class="savings-label">Annual Savings</p>
                </div>
            </div>
            <p style="margin-top: 20px; font-size: 18px;">
                <strong>Save ${calculationData.savings.percentSavings}% on processing costs!</strong>
            </p>
        </div>

        <div class="footer">
            <p>Generated by <strong>JACC Merchant Services</strong> | Professional Payment Processing Analysis</p>
            <p>Date: ${new Date().toLocaleDateString()}</p>
        </div>
    </body>
    </html>
  `;

  const puppeteer = await import('puppeteer');
  const browser = await puppeteer.default.launch({
    headless: true,
    executablePath: '/nix/store/zi4f80l169xlmivz8vja8wlphq74qqk0-chromium-125.0.6422.141/bin/chromium-browser',
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-gpu',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding'
    ]
  });
  
  const page = await browser.newPage();
  await page.setContent(html);
  
  const pdfBuffer = await page.pdf({
    format: 'A4',
    printBackground: true,
    margin: {
      top: '0.5in',
      right: '0.5in',
      bottom: '0.5in',
      left: '0.5in'
    }
  });
  
  await browser.close();
  return pdfBuffer;
}
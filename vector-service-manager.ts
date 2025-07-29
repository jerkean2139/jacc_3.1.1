import { VectorServiceManager } from './server/vector-service-manager';

// This is the main entry point for the vector service manager
// It provides a unified interface for vector operations with intelligent fallback

const vectorManager = new VectorServiceManager();

export default vectorManager;
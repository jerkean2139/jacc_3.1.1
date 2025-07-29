import * as userStore from "./user";
import * as chatStore from "./chat";
import * as folderStore from "./folder";
import * as documentStore from "./document";
import * as adminStore from "./admin";
import type { IStorage } from "./interface";

export class DatabaseStorage implements IStorage {
  // User operations
  getUser = userStore.getUser;
  createUser = userStore.createUser;
  upsertUser = userStore.upsertUser;
  
  // Chat operations
  getUserChats = chatStore.getUserChats;
  createChat = chatStore.createChat;
  getChatMessages = chatStore.getChatMessages;
  createMessage = chatStore.createMessage;
  
  // Folder operations
  getFolders = folderStore.getFolders;
  createFolder = folderStore.createFolder;
  
  // Document operations
  getDocuments = documentStore.getDocuments;
  createDocument = documentStore.createDocument;
  
  // Admin operations
  getAdminSettings = adminStore.getAdminSettings;
  updateAdminSettings = adminStore.updateAdminSettings;
  
  // Additional methods will be added as we migrate from the monolithic storage
}

// Export a singleton instance
export const storage = new DatabaseStorage();
export type { IStorage } from "./interface";
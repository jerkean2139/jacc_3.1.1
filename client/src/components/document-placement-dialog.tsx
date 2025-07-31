import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Folder,
  Shield,
  Users,
  Eye,
  Lock,
  Database,
  FileText,
  CheckCircle,
  Settings,
  Plus,
  FolderPlus
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Folder as FolderType } from "@shared/schema";

interface DocumentPlacementDialogProps {
  open: boolean;
  onClose: () => void;
  uploadedFiles: Array<{
    id: string;
    filename: string;
    size: number;
    mimeType: string;
  }>;
  onComplete: () => void;
}

interface DocumentPermissions {
  viewAll: boolean;
  adminOnly: boolean;
  managerAccess: boolean;
  agentAccess: boolean;
  trainingData: boolean;
  autoVectorize: boolean;
}

export default function DocumentPlacementDialog({ 
  open, 
  onClose, 
  uploadedFiles, 
  onComplete 
}: DocumentPlacementDialogProps) {
  const [selectedFolderId, setSelectedFolderId] = useState<string>("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [permissions, setPermissions] = useState<DocumentPermissions>({
    viewAll: true,
    adminOnly: false,
    managerAccess: true,
    agentAccess: true,
    trainingData: true,
    autoVectorize: true,
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch folders
  const { data: folders = [] } = useQuery<FolderType[]>({
    queryKey: ["/api/folders"],
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderName: string) => {
      console.log('🔨 Creating folder with name:', folderName);
      const response = await apiRequest('POST', '/api/folders', {
        name: folderName,
        folderType: 'custom',
        priority: 0,
        vectorNamespace: `folder_${folderName.toLowerCase().replace(/\s+/g, '_')}`
      });
      const result = await response.json();
      console.log('✅ Folder creation response:', result);
      return result;
    },
    onSuccess: (newFolder) => {
      console.log('✅ Folder created successfully:', newFolder);
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      setSelectedFolderId(newFolder.id);
      setNewFolderName('');
      setShowCreateFolder(false);
      toast({
        title: "Folder created",
        description: `New folder "${newFolder.name}" has been created and selected.`,
      });
    },
    onError: (error: any) => {
      console.error('❌ Folder creation failed:', error);
      toast({
        title: "Failed to create folder",
        description: error.message || "Could not create the new folder.",
        variant: "destructive",
      });
    },
  });

  // Process documents mutation
  const processDocumentsMutation = useMutation({
    mutationFn: async (data: {
      documentIds: string[];
      folderId: string;
      permissions: DocumentPermissions;
      tempFiles?: any[];
    }) => {
      const response = await fetch("/api/documents/process-placement", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to process document placement");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/folders"] });
      toast({
        title: "Documents processed successfully",
        description: "Documents have been placed in the selected folder with the specified permissions.",
      });
      onComplete();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Processing failed",
        description: error.message || "Failed to process document placement.",
        variant: "destructive",
      });
    },
  });

  const handlePermissionChange = (key: keyof DocumentPermissions, value: boolean) => {
    setPermissions(prev => ({ ...prev, [key]: value }));
  };

  const handleProcess = () => {
    if (!selectedFolderId) {
      toast({
        title: "Folder required",
        description: "Please select a folder for document placement.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    // Convert __root__ placeholder to null for backend
    const targetFolderId = selectedFolderId === "__root__" ? null : selectedFolderId;
    
    processDocumentsMutation.mutate({
      documentIds: uploadedFiles.map(file => file.id),
      folderId: targetFolderId,
      permissions,
      tempFiles: uploadedFiles,
    });
  };

  const getFileIcon = (mimeType: string | undefined) => {
    if (!mimeType) return <FileText className="h-4 w-4 text-gray-500" />;
    if (mimeType.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (mimeType.includes('word')) return <FileText className="h-4 w-4 text-blue-500" />;
    if (mimeType.includes('excel') || mimeType.includes('sheet')) return <FileText className="h-4 w-4 text-green-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Document Placement & Permissions
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Uploaded Files Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Uploaded Files ({uploadedFiles.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uploadedFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-3 p-2 border rounded">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{file.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Uploaded
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Folder Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Folder className="h-4 w-4" />
                Folder Placement
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Select destination folder</Label>
                  <Select value={selectedFolderId} onValueChange={setSelectedFolderId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a folder..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__root__">
                        <div className="flex items-center gap-2">
                          <Folder className="h-4 w-4 text-gray-500" />
                          Root Directory
                        </div>
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder.id} value={folder.id}>
                          <div className="flex items-center gap-2">
                            <Folder className="h-4 w-4 text-blue-500" />
                            <span>{folder.name}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {folder.documentCount || 0} docs
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Create New Folder Section */}
                <div className="border-t pt-3">
                  {!showCreateFolder ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCreateFolder(true)}
                      className="w-full"
                    >
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Create New Folder
                    </Button>
                  ) : (
                    <div className="space-y-3">
                      <Label>Create new folder</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter folder name..."
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && newFolderName.trim()) {
                              createFolderMutation.mutate(newFolderName.trim());
                            }
                            if (e.key === 'Escape') {
                              setShowCreateFolder(false);
                              setNewFolderName('');
                            }
                          }}
                        />
                        <Button
                          size="sm"
                          onClick={() => createFolderMutation.mutate(newFolderName.trim())}
                          disabled={!newFolderName.trim() || createFolderMutation.isPending}
                        >
                          {createFolderMutation.isPending ? 'Creating...' : 'Create'}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setShowCreateFolder(false);
                            setNewFolderName('');
                          }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Permissions Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm">
                <Shield className="h-4 w-4" />
                Access Permissions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Visibility Settings */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Visibility</Label>
                  
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="viewAll"
                        name="visibility"
                        checked={permissions.viewAll && !permissions.adminOnly}
                        onChange={() => {
                          setPermissions(prev => ({ 
                            ...prev, 
                            viewAll: true, 
                            adminOnly: false 
                          }));
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="viewAll" className="text-sm flex items-center gap-2">
                        <Eye className="h-3 w-3" />
                        Visible to all users
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="adminOnly"
                        name="visibility"
                        checked={permissions.adminOnly}
                        onChange={() => {
                          setPermissions(prev => ({ 
                            ...prev, 
                            viewAll: false, 
                            adminOnly: true 
                          }));
                        }}
                        className="h-4 w-4 text-blue-600"
                      />
                      <Label htmlFor="adminOnly" className="text-sm flex items-center gap-2">
                        <Lock className="h-3 w-3" />
                        Admin only access
                      </Label>
                    </div>
                  </div>
                </div>

                {/* Role Access */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Role Access</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="managerAccess"
                      checked={permissions.managerAccess}
                      onCheckedChange={(checked) => 
                        handlePermissionChange('managerAccess', checked as boolean)
                      }
                    />
                    <Label htmlFor="managerAccess" className="text-sm flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Manager access
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agentAccess"
                      checked={permissions.agentAccess}
                      onCheckedChange={(checked) => 
                        handlePermissionChange('agentAccess', checked as boolean)
                      }
                    />
                    <Label htmlFor="agentAccess" className="text-sm flex items-center gap-2">
                      <Users className="h-3 w-3" />
                      Agent access
                    </Label>
                  </div>
                </div>

                {/* AI Processing */}
                <div className="space-y-3 md:col-span-2">
                  <Label className="text-sm font-medium">AI Processing</Label>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="trainingData"
                      checked={permissions.trainingData}
                      onCheckedChange={(checked) => 
                        handlePermissionChange('trainingData', checked as boolean)
                      }
                    />
                    <Label htmlFor="trainingData" className="text-sm flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      Use as training data for AI responses
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="autoVectorize"
                      checked={permissions.autoVectorize}
                      onCheckedChange={(checked) => 
                        handlePermissionChange('autoVectorize', checked as boolean)
                      }
                    />
                    <Label htmlFor="autoVectorize" className="text-sm flex items-center gap-2">
                      <Database className="h-3 w-3" />
                      Auto-vectorize for search
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button 
              onClick={handleProcess} 
              disabled={!selectedFolderId || isProcessing}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? "Processing..." : "Complete Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
"use client";

import { useState, useEffect } from "react";
import { usePromptStore } from "@/store/promptStore";
import { Prompt } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Star, Plus, Edit, Trash2, Code, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// 로컬 Prompt 타입 확장
interface PromptWithAdmin extends Omit<Prompt, 'description'> {
  description: string | null;
  isAdminPrompt?: boolean;
  userId?: string;
}

export function PromptSidebar() {
  const { prompts: localPrompts, selectedPromptId, selectPrompt, addPrompt, updatePrompt, deletePrompt, toggleFavorite } = usePromptStore();
  const { user, token } = useAuthStore();
  
  const [prompts, setPrompts] = useState<PromptWithAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Omit<PromptWithAdmin, 'id'>>({
    name: '',
    description: '',
    template: '',
    category: '요약',
    outputFormat: 'text',
    isFavorite: false,
    isAdminPrompt: false
  });
  const [editingPrompt, setEditingPrompt] = useState<PromptWithAdmin | null>(null);

  // 프롬프트 목록 가져오기
  useEffect(() => {
    const fetchPrompts = async () => {
      if (!token) {
        // 토큰이 없으면 로컬 프롬프트 사용
        setPrompts(localPrompts);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('/api/prompts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('프롬프트 목록을 가져오는데 실패했습니다.');
        }
        
        const data = await response.json();
        setPrompts(data);
      } catch (error) {
        console.error('프롬프트 목록을 가져오는 중 오류가 발생했습니다:', error);
        setError(error instanceof Error ? error.message : '프롬프트 목록을 가져오는 중 오류가 발생했습니다.');
        // 오류 발생 시 로컬 프롬프트 사용
        setPrompts(localPrompts);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchPrompts();
  }, [token, localPrompts]);

  const favoritePrompts = prompts.filter(p => p.isFavorite);

  const handleSelectPrompt = (id: string) => {
    selectPrompt(id);
  };

  const handleAddPrompt = async () => {
    if (!newPrompt.name.trim() || !newPrompt.template.trim()) {
      toast.error("이름과 템플릿은 필수 입력 항목입니다.");
      return;
    }

    // 로컬 상태 업데이트 (타입 변환)
    addPrompt({
      ...newPrompt,
      description: newPrompt.description || '', // null을 빈 문자열로 변환
    });
    
    // 데이터베이스에 저장
    if (token) {
      try {
        const response = await fetch('/api/prompts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...newPrompt,
            isAdminPrompt: user?.role === 'admin' && newPrompt.isAdminPrompt,
          }),
        });
        
        if (!response.ok) {
          throw new Error('프롬프트를 저장하는데 실패했습니다.');
        }
        
        const data = await response.json();
        
        // 프롬프트 목록 다시 가져오기
        const promptsResponse = await fetch('/api/prompts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (promptsResponse.ok) {
          const promptsData = await promptsResponse.json();
          setPrompts(promptsData);
        }
      } catch (error) {
        console.error('프롬프트를 저장하는 중 오류가 발생했습니다:', error);
        toast.error(error instanceof Error ? error.message : '프롬프트를 저장하는 중 오류가 발생했습니다.');
      }
    }
    
    setNewPrompt({
      name: '',
      description: '',
      template: '',
      category: '요약',
      outputFormat: 'text',
      isFavorite: false,
      isAdminPrompt: false
    });
    setIsAddDialogOpen(false);
    toast.success("프롬프트가 추가되었습니다.");
  };

  const handleEditPrompt = async () => {
    if (!editingPrompt) return;
    
    if (!editingPrompt.name.trim() || !editingPrompt.template.trim()) {
      toast.error("이름과 템플릿은 필수 입력 항목입니다.");
      return;
    }

    // 로컬 상태 업데이트 (타입 변환)
    updatePrompt(editingPrompt.id, {
      ...editingPrompt,
      description: editingPrompt.description || '', // null을 빈 문자열로 변환
    });
    
    // 데이터베이스에 저장
    if (token) {
      try {
        const response = await fetch(`/api/prompts/${editingPrompt.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            ...editingPrompt,
            isAdminPrompt: user?.role === 'admin' ? editingPrompt.isAdminPrompt : false,
          }),
        });
        
        if (!response.ok) {
          throw new Error('프롬프트를 수정하는데 실패했습니다.');
        }
        
        // 프롬프트 목록 다시 가져오기
        const promptsResponse = await fetch('/api/prompts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (promptsResponse.ok) {
          const promptsData = await promptsResponse.json();
          setPrompts(promptsData);
        }
      } catch (error) {
        console.error('프롬프트를 수정하는 중 오류가 발생했습니다:', error);
        toast.error(error instanceof Error ? error.message : '프롬프트를 수정하는 중 오류가 발생했습니다.');
      }
    }
    
    setIsEditDialogOpen(false);
    toast.success("프롬프트가 수정되었습니다.");
  };

  const handleDeletePrompt = async (id: string) => {
    // 로컬 상태 업데이트
    deletePrompt(id);
    
    // 데이터베이스에서 삭제
    if (token) {
      try {
        const response = await fetch(`/api/prompts/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error('프롬프트를 삭제하는데 실패했습니다.');
        }
        
        // 프롬프트 목록 다시 가져오기
        const promptsResponse = await fetch('/api/prompts', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        
        if (promptsResponse.ok) {
          const promptsData = await promptsResponse.json();
          setPrompts(promptsData);
        }
      } catch (error) {
        console.error('프롬프트를 삭제하는 중 오류가 발생했습니다:', error);
        toast.error(error instanceof Error ? error.message : '프롬프트를 삭제하는 중 오류가 발생했습니다.');
      }
    }
    
    toast.info("프롬프트가 삭제되었습니다.");
  };

  const startEditPrompt = (prompt: PromptWithAdmin) => {
    // 관리자가 아닌 경우 관리자 프롬프트 수정 불가
    if (prompt.isAdminPrompt && user?.role !== 'admin') {
      toast.error("관리자 프롬프트는 관리자만 수정할 수 있습니다.");
      return;
    }
    
    setEditingPrompt({ ...prompt });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList className="w-full">
            <TabsTrigger value="all" className="flex-1">전체</TabsTrigger>
            <TabsTrigger value="favorites" className="flex-1">즐겨찾기</TabsTrigger>
          </TabsList>
        </div>

        <div className="mb-4">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="w-full">
                <Plus className="mr-2 h-4 w-4" />
                프롬프트 추가
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[80vh] overflow-auto">
              <DialogHeader>
                <DialogTitle>새 프롬프트 추가</DialogTitle>
                <DialogDescription>
                  새로운 프롬프트 템플릿을 추가합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right text-sm font-medium">
                    이름
                  </label>
                  <Input
                    id="name"
                    value={newPrompt.name}
                    onChange={(e) => setNewPrompt({ ...newPrompt, name: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right text-sm font-medium">
                    설명
                  </label>
                  <Input
                    id="description"
                    value={newPrompt.description || ''}
                    onChange={(e) => setNewPrompt({ ...newPrompt, description: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="category" className="text-right text-sm font-medium">
                    카테고리
                  </label>
                  <Input
                    id="category"
                    value={newPrompt.category}
                    onChange={(e) => setNewPrompt({ ...newPrompt, category: e.target.value })}
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="format" className="text-right text-sm font-medium">
                    출력 형식
                  </label>
                  <Select
                    value={newPrompt.outputFormat}
                    onValueChange={(value: 'html' | 'text') => setNewPrompt({ ...newPrompt, outputFormat: value })}
                  >
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="출력 형식 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">텍스트</SelectItem>
                      <SelectItem value="html">HTML</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {user?.role === 'admin' && (
                  <div className="grid grid-cols-4 items-center gap-4">
                    <div className="text-right text-sm font-medium">
                      관리자 프롬프트
                    </div>
                    <div className="col-span-3 flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="isAdminPrompt"
                        checked={newPrompt.isAdminPrompt}
                        onChange={(e) => 
                          setNewPrompt({ ...newPrompt, isAdminPrompt: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      <label htmlFor="isAdminPrompt" className="text-sm">
                        모든 사용자가 사용할 수 있는 관리자 프롬프트로 설정
                      </label>
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-4 items-start gap-4">
                  <label htmlFor="template" className="text-right text-sm font-medium">
                    템플릿
                  </label>
                  <Textarea
                    id="template"
                    value={newPrompt.template}
                    onChange={(e) => setNewPrompt({ ...newPrompt, template: e.target.value })}
                    className="col-span-3"
                    rows={5}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleAddPrompt}>추가</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <TabsContent value="all" className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">프롬프트 불러오는 중...</p>
            </div>
          ) : error ? (
            <div className="text-center py-4 text-red-500">
              <p className="text-sm">오류가 발생했습니다: {error}</p>
              <Button 
                variant="outline" 
                className="mt-2 text-xs"
                onClick={() => window.location.reload()}
              >
                다시 시도
              </Button>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              프롬프트가 없습니다.
            </div>
          ) : (
            prompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`w-full justify-start h-auto py-2 px-3 flex items-center rounded-md border ${
                  selectedPromptId === prompt.id 
                    ? "bg-primary text-primary-foreground" 
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => handleSelectPrompt(prompt.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate">
                    {prompt.outputFormat === 'html' ? (
                      <Code className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {prompt.name}
                      {prompt.isAdminPrompt && (
                        <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">[관리자]</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                    >
                      <Star
                        className={`h-4 w-4 ${
                          prompt.isFavorite ? "fill-yellow-400 text-yellow-400" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditPrompt(prompt);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrompt(prompt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-2">
          {isLoading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">프롬프트 불러오는 중...</p>
            </div>
          ) : favoritePrompts.length > 0 ? (
            favoritePrompts.map((prompt) => (
              <div
                key={prompt.id}
                className={`w-full justify-start h-auto py-2 px-3 flex items-center rounded-md border ${
                  selectedPromptId === prompt.id 
                    ? "bg-primary text-primary-foreground" 
                    : "border-input bg-background hover:bg-accent hover:text-accent-foreground"
                }`}
                onClick={() => handleSelectPrompt(prompt.id)}
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2 truncate">
                    {prompt.outputFormat === 'html' ? (
                      <Code className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <FileText className="h-4 w-4 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {prompt.name}
                      {prompt.isAdminPrompt && (
                        <span className="ml-1 text-xs text-blue-500 dark:text-blue-400">[관리자]</span>
                      )}
                    </span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(prompt.id);
                      }}
                    >
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditPrompt(prompt);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrompt(prompt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              즐겨찾기한 프롬프트가 없습니다.
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>프롬프트 수정</DialogTitle>
            <DialogDescription>
              프롬프트 템플릿을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="grid gap-4 py-4 overflow-y-auto max-h-[60vh]">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-name" className="text-right text-sm font-medium">
                  이름
                </label>
                <Input
                  id="edit-name"
                  value={editingPrompt.name}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-description" className="text-right text-sm font-medium">
                  설명
                </label>
                <Input
                  id="edit-description"
                  value={editingPrompt.description || ''}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, description: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-category" className="text-right text-sm font-medium">
                  카테고리
                </label>
                <Input
                  id="edit-category"
                  value={editingPrompt.category}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, category: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="edit-format" className="text-right text-sm font-medium">
                  출력 형식
                </label>
                <Select
                  value={editingPrompt.outputFormat}
                  onValueChange={(value: 'html' | 'text') => setEditingPrompt({ ...editingPrompt, outputFormat: value })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="출력 형식 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">텍스트</SelectItem>
                    <SelectItem value="html">HTML</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {user?.role === 'admin' && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="text-right text-sm font-medium">
                    관리자 프롬프트
                  </div>
                  <div className="col-span-3 flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="edit-isAdminPrompt"
                      checked={editingPrompt.isAdminPrompt}
                      onChange={(e) => 
                        setEditingPrompt({ ...editingPrompt, isAdminPrompt: e.target.checked })
                      }
                      className="h-4 w-4"
                    />
                    <label htmlFor="edit-isAdminPrompt" className="text-sm">
                      모든 사용자가 사용할 수 있는 관리자 프롬프트로 설정
                    </label>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-4 items-start gap-4">
                <label htmlFor="edit-template" className="text-right text-sm font-medium">
                  템플릿
                </label>
                <Textarea
                  id="edit-template"
                  value={editingPrompt.template}
                  onChange={(e) => setEditingPrompt({ ...editingPrompt, template: e.target.value })}
                  className="col-span-3"
                  rows={5}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleEditPrompt}>저장</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

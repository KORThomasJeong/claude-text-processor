"use client";

import { useState } from "react";
import { usePromptStore } from "@/store/promptStore";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Star, Plus, Edit, Trash2, Code, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Prompt } from "@/types";

export function PromptSelector() {
  const { prompts, selectedPromptId, selectPrompt, addPrompt, updatePrompt, deletePrompt, toggleFavorite } = usePromptStore();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPrompt, setNewPrompt] = useState<Omit<Prompt, 'id'>>({
    name: '',
    description: '',
    template: '',
    category: '요약',
    outputFormat: 'text',
    isFavorite: false
  });
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);

  const categories = Array.from(new Set(prompts.map(p => p.category)));
  const favoritePrompts = prompts.filter(p => p.isFavorite);

  const handleSelectPrompt = (id: string) => {
    selectPrompt(id);
  };

  const handleAddPrompt = () => {
    if (!newPrompt.name.trim() || !newPrompt.template.trim()) {
      toast.error("이름과 템플릿은 필수 입력 항목입니다.");
      return;
    }

    addPrompt(newPrompt);
    setNewPrompt({
      name: '',
      description: '',
      template: '',
      category: '요약',
      outputFormat: 'text',
      isFavorite: false
    });
    setIsAddDialogOpen(false);
    toast.success("프롬프트가 추가되었습니다.");
  };

  const handleEditPrompt = () => {
    if (!editingPrompt) return;
    
    if (!editingPrompt.name.trim() || !editingPrompt.template.trim()) {
      toast.error("이름과 템플릿은 필수 입력 항목입니다.");
      return;
    }

    updatePrompt(editingPrompt.id, editingPrompt);
    setIsEditDialogOpen(false);
    toast.success("프롬프트가 수정되었습니다.");
  };

  const handleDeletePrompt = (id: string) => {
    deletePrompt(id);
    toast.info("프롬프트가 삭제되었습니다.");
  };

  const startEditPrompt = (prompt: Prompt) => {
    setEditingPrompt({ ...prompt });
    setIsEditDialogOpen(true);
  };

  return (
    <div className="w-full">
      <Tabs defaultValue="all">
        <div className="flex justify-between items-center mb-4">
          <TabsList>
            <TabsTrigger value="all">전체</TabsTrigger>
            <TabsTrigger value="favorites">즐겨찾기</TabsTrigger>
            {categories.map(category => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                프롬프트 추가
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>새 프롬프트 추가</DialogTitle>
                <DialogDescription>
                  새로운 프롬프트 템플릿을 추가합니다.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
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
                    value={newPrompt.description}
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

        <TabsContent value="all" className="space-y-4">
          {prompts.map((prompt) => (
            <Card
              key={prompt.id}
              className={`cursor-pointer ${
                selectedPromptId === prompt.id ? "border-primary" : ""
              }`}
              onClick={() => handleSelectPrompt(prompt.id)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    {prompt.outputFormat === 'html' ? (
                      <Code className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    {prompt.name}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeletePrompt(prompt.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardTitle>
                <CardDescription>{prompt.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-2">
                  {prompt.template}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="text-xs text-muted-foreground">
                  카테고리: {prompt.category} | 출력: {prompt.outputFormat === 'html' ? 'HTML' : '텍스트'}
                </div>
              </CardFooter>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="favorites" className="space-y-4">
          {favoritePrompts.length > 0 ? (
            favoritePrompts.map((prompt) => (
              <Card
                key={prompt.id}
                className={`cursor-pointer ${
                  selectedPromptId === prompt.id ? "border-primary" : ""
                }`}
                onClick={() => handleSelectPrompt(prompt.id)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      {prompt.outputFormat === 'html' ? (
                        <Code className="h-4 w-4" />
                      ) : (
                        <FileText className="h-4 w-4" />
                      )}
                      {prompt.name}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
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
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePrompt(prompt.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                  <CardDescription>{prompt.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground line-clamp-2">
                    {prompt.template}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="text-xs text-muted-foreground">
                    카테고리: {prompt.category} | 출력: {prompt.outputFormat === 'html' ? 'HTML' : '텍스트'}
                  </div>
                </CardFooter>
              </Card>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              즐겨찾기한 프롬프트가 없습니다.
            </div>
          )}
        </TabsContent>

        {categories.map((category) => (
          <TabsContent key={category} value={category} className="space-y-4">
            {prompts
              .filter((p) => p.category === category)
              .map((prompt) => (
                <Card
                  key={prompt.id}
                  className={`cursor-pointer ${
                    selectedPromptId === prompt.id ? "border-primary" : ""
                  }`}
                  onClick={() => handleSelectPrompt(prompt.id)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {prompt.outputFormat === 'html' ? (
                          <Code className="h-4 w-4" />
                        ) : (
                          <FileText className="h-4 w-4" />
                        )}
                        {prompt.name}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePrompt(prompt.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardTitle>
                    <CardDescription>{prompt.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground line-clamp-2">
                      {prompt.template}
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="text-xs text-muted-foreground">
                      카테고리: {prompt.category} | 출력: {prompt.outputFormat === 'html' ? 'HTML' : '텍스트'}
                    </div>
                  </CardFooter>
                </Card>
              ))}
          </TabsContent>
        ))}
      </Tabs>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>프롬프트 수정</DialogTitle>
            <DialogDescription>
              프롬프트 템플릿을 수정합니다.
            </DialogDescription>
          </DialogHeader>
          {editingPrompt && (
            <div className="grid gap-4 py-4">
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
                  value={editingPrompt.description}
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

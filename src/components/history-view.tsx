"use client";

import { useState, useEffect, useRef } from "react";
import { useHistoryStore } from "@/store/historyStore";
import { usePromptStore } from "@/store/promptStore";
import { useAuthStore } from "@/store/authStore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Clock, Download, Save, Eye, Copy, Code, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

export function HistoryView() {
  const { results: processingResults, fetchResults, deleteResult, clearHistory } = useHistoryStore();
  const { prompts } = usePromptStore();
  const { user } = useAuthStore();
  
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCodeViewOpen, setIsCodeViewOpen] = useState(false);
  
  // 처리 중인 결과와 서버에서 가져온 결과를 합침
  const results = processingResults;
  
  const result = results.find(r => r.id === selectedResult);
  
  // 출력 결과와 HTML 코드 보기를 위한 ref
  const outputContentRef = useRef<HTMLDivElement | HTMLPreElement>(null);
  const codeViewContentRef = useRef<HTMLPreElement>(null);
  
  // 컴포넌트 마운트 시 처리 기록 가져오기
  useEffect(() => {
    fetchResults();
  }, [fetchResults]);
  
  // 날짜 포맷팅 헬퍼 함수
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return format(new Date(), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
    return format(new Date(dateStr), "yyyy년 MM월 dd일 HH:mm", { locale: ko });
  };
  
  // 클립보드에 복사하는 함수 - navigator.clipboard API 우선 사용
  const copyToClipboard = async (text: string) => {
    if (!text || text.trim() === '') {
      toast.error("복사할 내용이 없습니다.");
      return;
    }
    
    console.log("복사할 텍스트:", text); // 디버깅용
    
    try {
      // navigator.clipboard API 사용 (모던 브라우저)
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        toast.success("클립보드에 복사되었습니다.");
        return;
      }
      
      // 대체 방법: document.execCommand 사용
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 화면에서 보이지 않게 설정하되 포커스는 가능하도록
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      textArea.style.zIndex = '-1000';
      textArea.style.opacity = '0';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        toast.success("클립보드에 복사되었습니다.");
      } else {
        toast.error("클립보드 복사에 실패했습니다.");
      }
    } catch (err) {
      console.error("클립보드 복사 중 오류가 발생했습니다:", err);
      toast.error("클립보드 복사에 실패했습니다.");
    }
  };
  
  const handleSaveAsHtml = (content: string, format: 'html' | 'text') => {
    const blob = new Blob([format === "html" ? content : `<pre>${content}</pre>`], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-history-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("HTML 파일로 저장되었습니다.");
  };

  const handleSaveAsText = (content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-history-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("텍스트 파일로 저장되었습니다.");
  };

  const handleDeleteResult = async () => {
    if (selectedResult) {
      await deleteResult(selectedResult);
      setIsDeleteDialogOpen(false);
      setSelectedResult(null);
    }
  };

  const handleClearHistory = async () => {
    await clearHistory();
    setIsClearDialogOpen(false);
  };

  const getPromptName = (promptId: string) => {
    // 서버에서 가져온 결과에는 이미 prompt.name이 포함되어 있음
    const result = results.find(r => r.id === selectedResult);
    if (result && result.prompt && result.prompt.name) {
      return result.prompt.name;
    }
    
    const prompt = prompts.find(p => p.id === promptId);
    return prompt ? prompt.name : "알 수 없는 프롬프트";
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">처리 기록</h2>
        <Button
          variant="destructive"
          onClick={() => setIsClearDialogOpen(true)}
          disabled={results.length === 0 || !user || user.role !== 'admin'}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          모든 기록 삭제
        </Button>
      </div>

      {useHistoryStore.getState().isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">처리 기록을 불러오는 중...</p>
        </div>
      ) : useHistoryStore.getState().error ? (
        <div className="text-center py-12 text-red-500">
          <p>오류가 발생했습니다: {useHistoryStore.getState().error}</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => fetchResults()}
          >
            다시 시도
          </Button>
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          처리 기록이 없습니다.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map((result) => (
            <Card key={result.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <CardTitle className="flex justify-between items-center">
                  <div className="flex items-center gap-2 truncate">
                    <Clock className="h-4 w-4" />
                    {formatDate(result.timestamp || result.createdAt)}
                  </div>
                </CardTitle>
                <CardDescription>
                  프롬프트: {result.prompt?.name || getPromptName(result.promptId)}
                  {user?.role === 'admin' && result.user && (
                    <span className="ml-2 text-xs text-muted-foreground">
                      (사용자: {result.user?.name || result.user?.email || '알 수 없음'})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground line-clamp-3">
                  {result.input}
                </div>
                {result.isProcessing && (
                  <div className="mt-2 flex items-center text-sm text-yellow-600 dark:text-yellow-400">
                    <div className="animate-spin mr-2 h-3 w-3 border-2 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full"></div>
                    작성 중...
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 mt-auto flex justify-between">
                  <div className="text-xs text-muted-foreground">
                    출력 형식: {result.format === 'html' ? 'HTML' : '텍스트'}
                    <span className="ml-2">
                      {new Date(result.createdAt || result.timestamp || new Date().toISOString()).toLocaleString()}
                    </span>
                  </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedResult(result.id);
                      setIsViewDialogOpen(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setSelectedResult(result.id);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* 결과 보기 다이얼로그 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>처리 결과 보기</DialogTitle>
            <DialogDescription>
              {result && formatDate(result.timestamp || result.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {result && (
            <Tabs defaultValue="output" className="flex-1 overflow-hidden flex flex-col">
              <TabsList>
                <TabsTrigger value="input">입력</TabsTrigger>
                <TabsTrigger value="output">출력</TabsTrigger>
              </TabsList>
              
              <TabsContent value="input" className="flex-1 overflow-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>입력 텍스트</CardTitle>
                    <CardDescription>
                      프롬프트: {result.prompt?.name || getPromptName(result.promptId)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <pre className="whitespace-pre-wrap">{result.input}</pre>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="output" className="flex-1 overflow-auto">
                <Card>
                  <CardHeader>
                    <CardTitle>출력 결과</CardTitle>
                    <CardDescription>
                      형식: {result.format === 'html' ? 'HTML' : '텍스트'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result.isProcessing ? (
                      <div className="flex flex-col items-center justify-center py-8">
                        <div className="animate-spin mb-4 h-8 w-8 border-4 border-yellow-600 dark:border-yellow-400 border-t-transparent rounded-full"></div>
                        <p className="text-yellow-600 dark:text-yellow-400 font-medium">Claude가 응답을 작성 중입니다...</p>
                      </div>
                    ) : result.format === "html" ? (
                      <div
                        ref={outputContentRef as React.RefObject<HTMLDivElement>}
                        className="prose prose-sm dark:prose-invert max-w-none"
                        dangerouslySetInnerHTML={{ __html: result.output }}
                      />
                    ) : (
                      <pre ref={outputContentRef as React.RefObject<HTMLPreElement>} className="whitespace-pre-wrap">{result.output}</pre>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (!result || result.isProcessing) return;
                  
                  // 항상 원본 데이터를 사용하여 복사
                  copyToClipboard(result.output);
                }}
                disabled={result?.isProcessing}
              >
                <Copy className="mr-2 h-4 w-4" />
                클립보드에 복사
              </Button>
              {result && result.format === "html" && (
                <Button
                  variant="outline"
                  onClick={() => setIsCodeViewOpen(true)}
                  disabled={result?.isProcessing}
                >
                  <Code className="mr-2 h-4 w-4" />
                  코드 보기
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => result && handleSaveAsHtml(result.output, result.format)}
                disabled={result?.isProcessing}
              >
                <Save className="mr-2 h-4 w-4" />
                HTML로 저장
              </Button>
              <Button
                variant="outline"
                onClick={() => result && handleSaveAsText(result.output)}
                disabled={result?.isProcessing}
              >
                <Download className="mr-2 h-4 w-4" />
                텍스트로 저장
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>기록 삭제</DialogTitle>
            <DialogDescription>
              이 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteResult}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* HTML 코드 보기 다이얼로그 */}
      {result && result.format === "html" && (
        <Dialog open={isCodeViewOpen} onOpenChange={setIsCodeViewOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-auto">
            <DialogHeader>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsCodeViewOpen(false)}
                  className="mr-2"
                >
                  <ChevronLeft className="h-4 w-4" />
                  뒤로가기
                </Button>
                <DialogTitle>HTML 코드 보기</DialogTitle>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // 항상 원본 데이터를 사용하여 복사
                    copyToClipboard(result.output);
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  클립보드에 복사
                </Button>
              </div>
            </DialogHeader>
            <div className="h-full overflow-auto p-4 bg-muted rounded-md">
              <pre ref={codeViewContentRef} className="whitespace-pre-wrap text-sm">{result.output}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* 모든 기록 삭제 확인 다이얼로그 */}
      <Dialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>모든 기록 삭제</DialogTitle>
            <DialogDescription>
              모든 처리 기록을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsClearDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleClearHistory}>
              모두 삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

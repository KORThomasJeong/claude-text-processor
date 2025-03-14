"use client";

import { useState, useRef, useEffect } from "react";
import { usePromptStore } from "@/store/promptStore";
import { useApiStore } from "@/store/apiStore";
import { useHistoryStore } from "@/store/historyStore";
import { useAuthStore } from "@/store/authStore";
import { useTheme } from "next-themes";
import { ClaudeService } from "@/services/claudeService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PromptSidebar } from "@/components/prompt-sidebar";
import { toast } from "sonner";
import { Send, Save, Download, Loader2, ExternalLink, ChevronLeft, ChevronRight, Copy, Code, Maximize, MoonIcon, SunIcon, ArrowLeft } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import Link from "next/link";

export function TextProcessor() {
  const { config, isConfigured } = useApiStore();
  const { prompts, selectedPromptId } = usePromptStore();
  const { addResult, addProcessingResult, updateProcessingStatus } = useHistoryStore();
  const { theme, setTheme } = useTheme();
  const { user, token } = useAuthStore();
  
  const [inputText, setInputText] = useState("");
  const [outputText, setOutputText] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [outputFormat, setOutputFormat] = useState<"html" | "text">("text");
  const [isViewPromptDialogOpen, setIsViewPromptDialogOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFullscreenViewOpen, setIsFullscreenViewOpen] = useState(false);
  const [isCodeViewOpen, setIsCodeViewOpen] = useState(false);
  const [showHtmlCode, setShowHtmlCode] = useState(false);
  
  const outputRef = useRef<HTMLDivElement>(null);
  
  // 클립보드에 복사하는 함수 - navigator.clipboard API 우선 사용
  const copyToClipboard = async (text: string) => {
    if (!text || text.trim() === '') {
      toast.error("복사할 내용이 없습니다.");
      return;
    }
    
    console.log("복사할 텍스트:", text); // 디버깅용
    
    // navigator.clipboard API 사용 (모던 브라우저)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        toast.success("클립보드에 복사되었습니다.");
        return;
      } catch (err) {
        console.error("navigator.clipboard 사용 중 오류:", err);
        // 실패 시 대체 방법으로 진행
      }
    }
    
    // 대체 방법: document.execCommand 사용
    try {
      // 텍스트 영역 생성
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // 화면에서 보이지 않게 설정하되 포커스는 가능하도록
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '1em';
      textArea.style.height = '1em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
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
  
  const selectedPrompt = prompts.find(p => p.id === selectedPromptId);
  
  // 컴포넌트 마운트 시 프롬프트 목록 가져오기
  useEffect(() => {
    const fetchData = async () => {
      await usePromptStore.getState().fetchPrompts();
    };
    
    fetchData();
  }, []);
  
  // 선택된 프롬프트가 변경되면 출력 형식 업데이트
  useEffect(() => {
    if (selectedPrompt) {
      setOutputFormat(selectedPrompt.outputFormat);
    }
  }, [selectedPrompt]);

  const processText = async () => {
    if (!selectedPrompt) {
      toast.error("프롬프트를 선택해주세요.");
      return;
    }

    if (!inputText.trim()) {
      toast.error("텍스트를 입력해주세요.");
      return;
    }

    setIsProcessing(true);
    setOutputText("");
    
    // 처리 중인 결과 추가
    const processingId = addProcessingResult(
      inputText,
      selectedPrompt.id,
      selectedPrompt.outputFormat
    );

    try {
      const claudeService = new ClaudeService(config);
      const result = await claudeService.processText(inputText, selectedPrompt.template);
      
      setOutputText(result);
      
    // 결과 저장 (데이터베이스)
    await addResult({
      input: inputText,
      output: result,
      promptId: selectedPrompt.id,
      format: selectedPrompt.outputFormat,
    });
    
    // 처리 중 상태 업데이트 - 성공 시에도 처리 중 상태를 false로 변경
    updateProcessingStatus(processingId, false);
    
    toast.success("텍스트 처리가 완료되었습니다.");
    } catch (error) {
      console.error("텍스트 처리 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "텍스트 처리 중 오류가 발생했습니다.");
      
      // 처리 중 상태 업데이트
      updateProcessingStatus(processingId, false);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSaveAsHtml = () => {
    if (!outputText) {
      toast.error("저장할 결과가 없습니다.");
      return;
    }

    const blob = new Blob([outputFormat === "html" ? outputText : `<pre>${outputText}</pre>`], {
      type: "text/html",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-result-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("HTML 파일로 저장되었습니다.");
  };

  const handleSaveAsText = () => {
    if (!outputText) {
      toast.error("저장할 결과가 없습니다.");
      return;
    }

    const blob = new Blob([outputText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claude-result-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.success("텍스트 파일로 저장되었습니다.");
  };

  return (
    <div className="p-0 h-full">
      {!isConfigured && (
        <div className="mb-8 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium mb-1">API 키가 설정되지 않았습니다</h3>
              <p className="text-sm text-muted-foreground">
                Claude API를 사용하려면 API 키를 설정해야 합니다.
              </p>
            </div>
            <Link href="/settings">
              <Button>
                API 설정하기
                <ExternalLink className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex">
        {/* 사이드바 토글 버튼 */}
        <div className="relative">
          <Button
            variant="outline"
            className="fixed left-0 top-[80px] z-10 rounded-l-none"
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="mr-2 h-4 w-4" />
            ) : (
              <>
                <ChevronRight className="mr-2 h-4 w-4" />
                <span>프롬프트 열기</span>
              </>
            )}
          </Button>
          
          {/* 프롬프트 사이드바 */}
          <div 
            className={`fixed left-0 top-0 h-full bg-background border-r transition-all duration-300 z-50 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            }`}
            style={{ width: "400px" }}
          >
            <div className="p-4 h-full overflow-auto">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">프롬프트 선택</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  <ChevronLeft />
                </Button>
              </div>
              <PromptSidebar />
            </div>
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <div className="flex-1 min-h-[600px] rounded-lg h-full">
          <div className="flex flex-col h-full" style={{ height: "calc(100vh - 4rem)" }}>
            {/* 선택된 프롬프트 정보 */}
            <div className="p-4 w-full bg-gray-50 dark:bg-gray-800/30">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-semibold">
                    프롬프트: {selectedPrompt ? selectedPrompt.name : "프롬프트를 선택해주세요"}
                  </h2>
                  {selectedPrompt && (
                    <p className="text-sm text-muted-foreground">{selectedPrompt.description}</p>
                  )}
                </div>
                {selectedPrompt && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsViewPromptDialogOpen(true)}
                  >
                    프롬프트 자세히 보기
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-0 flex-1" style={{ height: "calc(100% - 4rem)" }}>
              {/* 텍스트 입력 영역 */}
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-lg font-semibold">텍스트 입력</h2>
                  <Button
                    onClick={processText}
                    disabled={isProcessing || !selectedPromptId || !inputText.trim()}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        처리 중...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        처리하기
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex-1 border rounded-md p-2">
                  <textarea
                    placeholder="처리할 텍스트를 입력하세요..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="w-full h-full resize-none outline-none border-0 bg-transparent"
                    style={{ minHeight: "calc(100% - 16px)" }}
                  />
                </div>
              </div>

              {/* 결과 출력 영역 */}
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center p-4">
                  <h2 className="text-lg font-semibold">결과 출력</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (outputFormat === "html") {
                          // HTML 출력인 경우 HTML 코드 자체를 복사
                          copyToClipboard(outputText);
                        } else {
                          // 텍스트 출력인 경우 pre 태그 내용을 직접 복사
                          const preElement = document.querySelector('.card .whitespace-pre-wrap');
                          if (preElement) {
                            copyToClipboard(preElement.textContent || '');
                          } else {
                            copyToClipboard(outputText);
                          }
                        }
                      }}
                      disabled={!outputText}
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      클립보드에 복사
                    </Button>
                    {outputFormat === "html" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsCodeViewOpen(true)}
                        disabled={!outputText}
                      >
                        <Code className="mr-2 h-4 w-4" />
                        코드 보기
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAsHtml}
                      disabled={!outputText}
                    >
                      <Save className="mr-2 h-4 w-4" />
                      HTML로 저장
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSaveAsText}
                      disabled={!outputText}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      텍스트로 저장
                    </Button>
                  </div>
                </div>
                
                <Card className="flex-1">
                  <CardContent className="p-4 overflow-auto" style={{ height: "100%" }}>
                    {outputFormat === "html" ? (
                      <div className="relative group">
                        <div
                          ref={outputRef}
                          className="prose prose-sm dark:prose-invert max-w-none cursor-pointer"
                          dangerouslySetInnerHTML={{ __html: outputText }}
                          onClick={() => setIsFullscreenViewOpen(true)}
                        />
                        <div 
                          className="absolute inset-0 bg-black bg-opacity-30 flex items-start justify-center pt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                          onClick={() => setIsFullscreenViewOpen(true)}
                        >
                          <span className="text-white text-lg font-medium bg-black bg-opacity-50 px-4 py-2 rounded">전체화면으로 보기</span>
                        </div>
                      </div>
                    ) : (
                      <pre className="whitespace-pre-wrap">{outputText}</pre>
                    )}
                    {!outputText && !isProcessing && (
                      <div className="text-center text-muted-foreground py-8">
                        텍스트를 입력하고 처리하기 버튼을 클릭하세요.
                      </div>
                    )}
                    {isProcessing && (
                      <div className="flex justify-center items-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 프롬프트 자세히 보기 다이얼로그 */}
      {selectedPrompt && (
        <Dialog open={isViewPromptDialogOpen} onOpenChange={setIsViewPromptDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedPrompt.name}</DialogTitle>
              <DialogDescription>{selectedPrompt.description}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">프롬프트 템플릿</CardTitle>
                  <CardDescription>
                    이 템플릿은 입력 텍스트와 함께 Claude API로 전송됩니다.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-md whitespace-pre-wrap text-sm">
                    {selectedPrompt.template}
                  </pre>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">카테고리</h3>
                  <p>{selectedPrompt.category}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">출력 형식</h3>
                  <p>{selectedPrompt.outputFormat === 'html' ? 'HTML' : '텍스트'}</p>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* HTML 출력 전체화면 보기 다이얼로그 */}
      {outputFormat === "html" && outputText && (
        <Dialog open={isFullscreenViewOpen} onOpenChange={setIsFullscreenViewOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-auto sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw]" style={{ width: "90vw", height: "90vh" }}>
            <DialogHeader>
              <DialogTitle>HTML 출력 전체화면 보기</DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(outputText)}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  클립보드에 복사
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCodeViewOpen(true)}
                >
                  <Code className="mr-2 h-4 w-4" />
                  코드 보기
                </Button>
              </div>
            </DialogHeader>
            <div 
              className="prose prose-sm dark:prose-invert max-w-none h-full overflow-auto p-4"
              dangerouslySetInnerHTML={{ __html: outputText }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* HTML 코드 보기 다이얼로그 */}
      {outputFormat === "html" && outputText && (
        <Dialog open={isCodeViewOpen} onOpenChange={setIsCodeViewOpen}>
          <DialogContent className="max-w-[90vw] max-h-[90vh] w-[90vw] h-[90vh] overflow-auto sm:max-w-[90vw] md:max-w-[90vw] lg:max-w-[90vw]" style={{ width: "90vw", height: "90vh" }}>
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
                    // pre 태그 내용을 직접 복사
                    const preElement = document.querySelector('.bg-muted.rounded-md pre.whitespace-pre-wrap.text-sm');
                    if (preElement) {
                      copyToClipboard(preElement.textContent || '');
                    } else {
                      copyToClipboard(outputText);
                    }
                  }}
                >
                  <Copy className="mr-2 h-4 w-4" />
                  클립보드에 복사
                </Button>
              </div>
            </DialogHeader>
            <div className="h-full overflow-auto p-4 bg-muted rounded-md">
              <pre className="whitespace-pre-wrap text-sm">{outputText}</pre>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

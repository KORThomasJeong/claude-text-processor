"use client";

import { useState, useEffect } from "react";
import { useApiStore } from "@/store/apiStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Key, Save, Trash2, Link as LinkIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ClaudeService } from "@/services/claudeService";
import { ClaudeModel } from "@/types";

export function ApiKeyInput() {
  const { config, setApiKey, setModel, setMaxTokens, clearApiConfig } = useApiStore();
  const [apiKey, setApiKeyLocal] = useState(config.apiKey);
  const [model, setModelLocal] = useState(config.model);
  const [maxTokens, setMaxTokensLocal] = useState(config.maxTokens.toString());
  const [isConnecting, setIsConnecting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [models, setModels] = useState<ClaudeModel[]>([]);

  // 데이터베이스에서 API 설정 가져오기
  useEffect(() => {
    const fetchApiConfig = async () => {
      try {
        setIsLoading(true);
        
        // API 라우트를 통해 데이터베이스에서 API 설정 가져오기
        // 현재 인증된 사용자의 API 설정을 가져옴
        const response = await fetch('/api/api-config');
        
        if (response.ok) {
          const data = await response.json();
          
          // API 키가 있는지 확인
          const hasApiKey = data.hasApiKey || false;
          
          // API 키가 없는 경우에만 로컬 상태 업데이트
          if (!hasApiKey) {
            setApiKeyLocal(data.apiKey || '');
            setApiKey(data.apiKey || '');
          }
          
          setModelLocal(data.model);
          setMaxTokensLocal(data.maxTokens.toString());
          setModel(data.model);
          setMaxTokens(data.maxTokens);
          
          // API 키가 있으면 모델 목록 가져오기
          if (hasApiKey || data.apiKey) {
            try {
              // API 키가 마스킹되어 있으면 직접 API 호출하지 않고 서버 엔드포인트 사용
              const modelsResponse = await fetch('/api/claude/models');
              
              if (modelsResponse.ok) {
                const modelsData = await modelsResponse.json();
                
                if (modelsData.data && Array.isArray(modelsData.data)) {
                  const modelList = modelsData.data.map((model: any) => ({
                    id: model.id,
                    name: model.display_name || model.id,
                    createdAt: model.created_at || "",
                  }));
                  
                  setModels(modelList);
                }
              }
            } catch (error) {
              console.error("모델 목록을 가져오는 중 오류가 발생했습니다:", error);
            }
          }
        }
      } catch (error) {
        console.error("API 설정을 가져오는 중 오류가 발생했습니다:", error);
        toast.error("API 설정을 가져오는 중 오류가 발생했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchApiConfig();
  }, [setApiKey, setModel, setMaxTokens]);

  const handleConnect = async () => {
    if (!apiKey.trim()) {
      toast.error("API 키를 입력해주세요.");
      return;
    }

    setIsConnecting(true);

    try {
      // API 키를 URL 파라미터로 전달하여 모델 목록 가져오기
      const response = await fetch(`/api/claude/models?apiKey=${encodeURIComponent(apiKey)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "API 연결 중 오류가 발생했습니다.");
      }
      
      const data = await response.json();
      
      if (!data.data || !Array.isArray(data.data)) {
        throw new Error("모델 목록을 가져오는데 실패했습니다.");
      }
      
      const modelList = data.data.map((model: any) => ({
        id: model.id,
        name: model.display_name || model.id,
        createdAt: model.created_at || "",
      }));
      
      setModels(modelList);
      
      if (modelList.length > 0) {
        // 기본 모델 설정 (첫 번째 모델)
        setModelLocal(modelList[0].id);
      }
      
      toast.success("API 연결에 성공했습니다.");
    } catch (error) {
      console.error("API 연결 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "API 연결 중 오류가 발생했습니다.");
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      toast.error("API 키를 입력해주세요.");
      return;
    }

    if (!model) {
      toast.error("모델을 선택해주세요.");
      return;
    }

    setApiKey(apiKey);
    setModel(model);
    setMaxTokens(parseInt(maxTokens, 10) || 4096);
    
    // 데이터베이스에 API 설정 저장
    try {
      // API 라우트를 통해 데이터베이스에 API 설정 저장
      // 현재 인증된 사용자의 API 설정을 저장
      const response = await fetch('/api/api-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey,
          model,
          maxTokens: parseInt(maxTokens, 10) || 4096,
        }),
      });
      
      if (response.ok) {
        toast.success("API 설정이 저장되었습니다.");
      } else {
        const data = await response.json();
        throw new Error(data.error || "API 설정 저장 중 오류가 발생했습니다.");
      }
    } catch (error) {
      console.error("API 설정 저장 중 오류가 발생했습니다:", error);
      toast.error("API 설정 저장 중 오류가 발생했습니다.");
    }
  };

  const handleClear = () => {
    clearApiConfig();
    setApiKeyLocal("");
    setModelLocal("claude-3-7-sonnet-20250219");
    setMaxTokensLocal("4096");
    setModels([]);
    toast.info("API 설정이 초기화되었습니다.");
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Claude API 설정
        </CardTitle>
        <CardDescription>
          Claude API를 사용하기 위한 설정을 입력해주세요.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">설정을 불러오는 중...</span>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label htmlFor="api-key" className="text-sm font-medium">
                API 키
              </label>
              <div className="flex gap-2">
                <Input
                  id="api-key"
                  type="password"
                  placeholder="Claude API 키를 입력하세요"
                  value={apiKey}
                  onChange={(e) => setApiKeyLocal(e.target.value)}
                  className="flex-1"
                />
                <Button 
                  onClick={handleConnect}
                  disabled={isConnecting || !apiKey.trim()}
                >
                  {isConnecting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      연결 중...
                    </>
                  ) : (
                    <>
                      <LinkIcon className="mr-2 h-4 w-4" />
                      연결하기
                    </>
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="model" className="text-sm font-medium">
                모델
              </label>
              <Select value={model} onValueChange={setModelLocal} disabled={models.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder="모델 선택" />
                </SelectTrigger>
                <SelectContent>
                  {models.length > 0 ? (
                    models.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="default-model" disabled>
                      API 키를 입력하고 연결하기를 클릭하세요
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label htmlFor="max-tokens" className="text-sm font-medium">
                최대 토큰 수
              </label>
              <Input
                id="max-tokens"
                type="number"
                placeholder="최대 토큰 수"
                value={maxTokens}
                onChange={(e) => setMaxTokensLocal(e.target.value)}
                min="1"
                max="200000"
              />
            </div>
          </>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" onClick={handleClear} disabled={isLoading}>
          <Trash2 className="mr-2 h-4 w-4" />
          초기화
        </Button>
        <Button onClick={handleSave} disabled={isLoading || !model || !apiKey.trim()}>
          <Save className="mr-2 h-4 w-4" />
          저장
        </Button>
      </CardFooter>
    </Card>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { Loader2, MoreHorizontal, Plus, Search, Trash, Key, UserCog } from "lucide-react";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

interface User {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    prompts: number;
    results: number;
  };
}

export default function UsersPage() {
  const router = useRouter();
  const { user, token, isAuthenticated } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isChangeRoleDialogOpen, setIsChangeRoleDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newUserData, setNewUserData] = useState({
    email: "",
    password: "",
    name: "",
    role: "user",
  });
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"user" | "admin" | "pending">("user");

  // 관리자 권한 확인
  useEffect(() => {
    if (isAuthenticated && user && user.role !== "admin") {
      toast.error("관리자만 접근할 수 있습니다.");
      router.push("/");
    }
  }, [isAuthenticated, user, router]);

  // 사용자 목록 가져오기
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (searchTerm) {
        queryParams.set("search", searchTerm);
      }

      const response = await fetch(`/api/users?${queryParams.toString()}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("사용자 목록을 가져오는데 실패했습니다.");
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error("사용자 목록을 가져오는 중 오류가 발생했습니다:", error);
      toast.error("사용자 목록을 가져오는데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && user?.role === "admin") {
      fetchUsers();
    }
  }, [isAuthenticated, user, searchTerm]);

  // 사용자 생성
  const handleCreateUser = async () => {
    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUserData),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "사용자 생성에 실패했습니다.");
      }

      toast.success("사용자가 생성되었습니다.");
      setIsCreateDialogOpen(false);
      setNewUserData({
        email: "",
        password: "",
        name: "",
        role: "user",
      });
      fetchUsers();
    } catch (error) {
      console.error("사용자 생성 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "사용자 생성에 실패했습니다.");
    }
  };

  // 사용자 삭제
  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "사용자 삭제에 실패했습니다.");
      }

      toast.success("사용자가 삭제되었습니다.");
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("사용자 삭제 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "사용자 삭제에 실패했습니다.");
    }
  };

  // 비밀번호 초기화
  const handleResetPassword = async () => {
    if (!selectedUser || !newPassword) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: newPassword }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "비밀번호 초기화에 실패했습니다.");
      }

      toast.success("비밀번호가 초기화되었습니다.");
      setIsResetPasswordDialogOpen(false);
      setSelectedUser(null);
      setNewPassword("");
    } catch (error) {
      console.error("비밀번호 초기화 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "비밀번호 초기화에 실패했습니다.");
    }
  };

  // 역할 변경
  const handleChangeRole = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role: newRole }),
        credentials: "include",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "역할 변경에 실패했습니다.");
      }

      toast.success("사용자 역할이 변경되었습니다.");
      setIsChangeRoleDialogOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error("역할 변경 중 오류가 발생했습니다:", error);
      toast.error(error instanceof Error ? error.message : "역할 변경에 실패했습니다.");
    }
  };

  if (!isAuthenticated || (user && user.role !== "admin")) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>사용자 관리</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="이메일 또는 이름으로 검색"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-[250px]"
              />
            </div>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              사용자 추가
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>이메일</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>역할</TableHead>
                  <TableHead>생성일</TableHead>
                  <TableHead>프롬프트 수</TableHead>
                  <TableHead>처리 기록 수</TableHead>
                  <TableHead className="w-[80px]">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      사용자가 없습니다.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.name || "-"}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === "admin"
                              ? "bg-primary/20 text-primary"
                              : user.role === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {user.role === "admin" 
                            ? "관리자" 
                            : user.role === "pending" 
                            ? "승인 대기" 
                            : "사용자"}
                        </span>
                      </TableCell>
                      <TableCell>
                        {format(new Date(user.createdAt), "yyyy년 MM월 dd일", {
                          locale: ko,
                        })}
                      </TableCell>
                      <TableCell>{user._count?.prompts || 0}</TableCell>
                      <TableCell>{user._count?.results || 0}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setNewRole(user.role as "user" | "admin");
                                setIsChangeRoleDialogOpen(true);
                              }}
                            >
                              <UserCog className="mr-2 h-4 w-4" />
                              역할 변경
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsResetPasswordDialogOpen(true);
                              }}
                            >
                              <Key className="mr-2 h-4 w-4" />
                              비밀번호 초기화
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDeleteDialogOpen(true);
                              }}
                              className="text-destructive"
                            >
                              <Trash className="mr-2 h-4 w-4" />
                              삭제
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 사용자 생성 다이얼로그 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>새 사용자 추가</DialogTitle>
            <DialogDescription>
              새로운 사용자 계정을 생성합니다. 이메일과 비밀번호는 필수 항목입니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                이메일
              </label>
              <Input
                id="email"
                type="email"
                placeholder="이메일 주소"
                value={newUserData.email}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, email: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="password" className="text-sm font-medium">
                비밀번호
              </label>
              <Input
                id="password"
                type="password"
                placeholder="비밀번호"
                value={newUserData.password}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, password: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                이름 (선택사항)
              </label>
              <Input
                id="name"
                type="text"
                placeholder="이름"
                value={newUserData.name}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, name: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                역할
              </label>
              <select
                id="role"
                className="w-full p-2 border rounded-md"
                value={newUserData.role}
                onChange={(e) =>
                  setNewUserData({ ...newUserData, role: e.target.value })
                }
              >
                <option value="user">사용자</option>
                <option value="admin">관리자</option>
                <option value="pending">승인 대기</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateDialogOpen(false)}
            >
              취소
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={!newUserData.email || !newUserData.password}
            >
              사용자 추가
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 사용자 삭제 다이얼로그 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>사용자 삭제</DialogTitle>
            <DialogDescription>
              정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없으며, 사용자의 모든 데이터가 삭제됩니다.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="font-medium">
              {selectedUser?.email} ({selectedUser?.name || "이름 없음"})
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              취소
            </Button>
            <Button variant="destructive" onClick={handleDeleteUser}>
              삭제
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 비밀번호 초기화 다이얼로그 */}
      <Dialog
        open={isResetPasswordDialogOpen}
        onOpenChange={setIsResetPasswordDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>비밀번호 초기화</DialogTitle>
            <DialogDescription>
              사용자의 비밀번호를 초기화합니다. 새 비밀번호를 입력하세요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-medium">
              {selectedUser?.email} ({selectedUser?.name || "이름 없음"})
            </p>
            <div className="space-y-2">
              <label htmlFor="newPassword" className="text-sm font-medium">
                새 비밀번호
              </label>
              <Input
                id="newPassword"
                type="password"
                placeholder="새 비밀번호"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsResetPasswordDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleResetPassword} disabled={!newPassword}>
              비밀번호 초기화
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 역할 변경 다이얼로그 */}
      <Dialog
        open={isChangeRoleDialogOpen}
        onOpenChange={setIsChangeRoleDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>역할 변경</DialogTitle>
            <DialogDescription>
              사용자의 역할을 변경합니다. 관리자는 모든 기능에 접근할 수 있습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="font-medium">
              {selectedUser?.email} ({selectedUser?.name || "이름 없음"})
            </p>
            <div className="space-y-2">
              <label htmlFor="role" className="text-sm font-medium">
                역할
              </label>
              <select
                id="role"
                className="w-full p-2 border rounded-md"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as "user" | "admin" | "pending")}
              >
                <option value="user">사용자</option>
                <option value="admin">관리자</option>
                <option value="pending">승인 대기</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsChangeRoleDialogOpen(false)}
            >
              취소
            </Button>
            <Button onClick={handleChangeRole}>역할 변경</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

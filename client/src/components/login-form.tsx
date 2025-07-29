import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
<<<<<<< HEAD
import { useAuth } from "@/hooks/useAuth";
=======
import { useAuth } from "@/hooks/use-auth";
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
import { Eye, EyeOff, User, Users, Shield } from "lucide-react";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { loginMutation } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
<<<<<<< HEAD
    console.log('Login form submitting with:', { email, password: '***' });
    loginMutation.mutate({ email, password });
  };


=======
    loginMutation.mutate({ email, password });
  };

  const demoUsers = [
    {
      role: "Sales Agent",
      email: "sarah@tracerco.com",
      password: "sales123",
      icon: User,
      description: "Access sales tools and client management"
    },
    {
      role: "Client Admin", 
      email: "admin@testcompany.com",
      password: "admin123",
      icon: Users,
      description: "Manage company settings and users"
    },
    {
      role: "Dev Admin",
      email: "dev@jacc.com", 
      password: "dev123",
      icon: Shield,
      description: "Full system access and configuration"
    }
  ];

  const fillCredentials = (email: string, password: string) => {
    setEmail(email);
    setPassword(password);
  };
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Sign In to JACC</CardTitle>
          <CardDescription>
            Enter your credentials to access your merchant services assistant
          </CardDescription>
<<<<<<< HEAD
          <div className="bg-blue-50 p-3 rounded-md text-sm text-blue-700">
            <p className="font-medium">Test Credentials:</p>
            <p>Admin: <code className="bg-blue-100 px-1 rounded">admin</code> / <code className="bg-blue-100 px-1 rounded">admin123</code></p>
            <p>Sales: <code className="bg-blue-100 px-1 rounded">cburnell</code> / <code className="bg-blue-100 px-1 rounded">cburnell123</code></p>
          </div>
=======
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
<<<<<<< HEAD
              <Label htmlFor="email">Username</Label>
              <Input
                id="email"
                type="text"
                placeholder="Enter your username (e.g., cburnell, admin)"
=======
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <Button 
              type="submit" 
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>

<<<<<<< HEAD

=======
      {/* Demo Credentials */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Demo Accounts</CardTitle>
          <CardDescription>
            Click any option below to auto-fill credentials for testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {demoUsers.map((user) => {
            const IconComponent = user.icon;
            return (
              <Button
                key={user.email}
                variant="outline"
                className="w-full justify-start h-auto p-4"
                onClick={() => fillCredentials(user.email, user.password)}
              >
                <IconComponent className="h-5 w-5 mr-3 text-blue-600" />
                <div className="text-left">
                  <div className="font-medium">{user.role}</div>
                  <div className="text-sm text-slate-500">{user.email}</div>
                  <div className="text-xs text-slate-400">{user.description}</div>
                </div>
              </Button>
            );
          })}
        </CardContent>
      </Card>
>>>>>>> 7bde7c2493f5dfadbacbd14e0de16b792f67f2d8
    </div>
  );
}
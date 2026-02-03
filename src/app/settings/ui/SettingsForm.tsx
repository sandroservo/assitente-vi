/**
 * Autor: Sandro Servo
 * Site: https://cloudservo.com.br
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Save, 
  Loader2, 
  Wifi, 
  Key, 
  Bot,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsFormProps {
  settings: {
    evolutionBaseUrl: string;
    evolutionInstance: string;
    evolutionToken: string;
    webhookSecret: string;
    openaiApiKey: string;
    systemPrompt: string;
  };
  defaultSystemPrompt: string;
}

export function SettingsForm({ settings, defaultSystemPrompt }: SettingsFormProps) {
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setMessage({ type: "success", text: "Configurações salvas com sucesso!" });
      } else {
        setMessage({ type: "error", text: "Erro ao salvar configurações" });
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao salvar configurações" });
    } finally {
      setLoading(false);
    }
  }

  function handleChange(field: string, value: string) {
    setFormData({ ...formData, [field]: value });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {message && (
        <Alert variant={message.type === "error" ? "destructive" : "default"}>
          {message.type === "success" ? (
            <CheckCircle className="h-4 w-4" />
          ) : (
            <AlertCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="evolution" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Evolution API
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            OpenAI
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            System Prompt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evolution" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da Evolution API</CardTitle>
              <CardDescription>
                Configure a conexão com o WhatsApp via Evolution API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="evolutionBaseUrl">URL Base</Label>
                <Input
                  id="evolutionBaseUrl"
                  value={formData.evolutionBaseUrl}
                  onChange={(e) => handleChange("evolutionBaseUrl", e.target.value)}
                  placeholder="https://evolution.seudominio.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evolutionInstance">Nome da Instância</Label>
                <Input
                  id="evolutionInstance"
                  value={formData.evolutionInstance}
                  onChange={(e) => handleChange("evolutionInstance", e.target.value)}
                  placeholder="amovidas"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="evolutionToken">Token da API</Label>
                <Input
                  id="evolutionToken"
                  type="password"
                  value={formData.evolutionToken}
                  onChange={(e) => handleChange("evolutionToken", e.target.value)}
                  placeholder="••••••••••••••••"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="webhookSecret">Webhook Secret</Label>
                <Input
                  id="webhookSecret"
                  type="password"
                  value={formData.webhookSecret}
                  onChange={(e) => handleChange("webhookSecret", e.target.value)}
                  placeholder="••••••••••••••••"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openai" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Configurações da OpenAI</CardTitle>
              <CardDescription>
                Configure a chave de API da OpenAI para a Vi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="openaiApiKey">API Key</Label>
                <Input
                  id="openaiApiKey"
                  type="password"
                  value={formData.openaiApiKey}
                  onChange={(e) => handleChange("openaiApiKey", e.target.value)}
                  placeholder="sk-••••••••••••••••"
                />
                <p className="text-xs text-gray-500">
                  Obtenha sua chave em{" "}
                  <a
                    href="https://platform.openai.com/api-keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-pink-500 hover:underline"
                  >
                    platform.openai.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prompt" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>System Prompt da Vi</CardTitle>
              <CardDescription>
                Configure a personalidade e comportamento da Vi
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt</Label>
                <Textarea
                  id="systemPrompt"
                  value={formData.systemPrompt || defaultSystemPrompt}
                  onChange={(e) => handleChange("systemPrompt", e.target.value)}
                  placeholder="Você é a Vi, assistente virtual..."
                  rows={15}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-gray-500">
                  Deixe vazio para usar o prompt padrão do arquivo agent/systemprompt.md
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleChange("systemPrompt", "")}
                className="text-sm"
              >
                Restaurar Padrão
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button
          type="submit"
          disabled={loading}
          className="bg-pink-500 hover:bg-pink-600"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Salvar Configurações
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

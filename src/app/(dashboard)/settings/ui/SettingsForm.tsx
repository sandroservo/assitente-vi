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
  Copy,
  Check,
  Link,
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
    asaasWebhookUrl: string;
  };
  defaultSystemPrompt: string;
}

export function SettingsForm({ settings, defaultSystemPrompt }: SettingsFormProps) {
  const [formData, setFormData] = useState(settings);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const webhookUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/webhooks/evolution`
    : "/api/webhooks/evolution";

  async function copyWebhookUrl() {
    await navigator.clipboard.writeText(webhookUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evolution" className="flex items-center gap-2">
            <Wifi className="h-4 w-4" />
            Evolution
          </TabsTrigger>
          <TabsTrigger value="openai" className="flex items-center gap-2">
            <Key className="h-4 w-4" />
            OpenAI
          </TabsTrigger>
          <TabsTrigger value="integrations" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Integrações
          </TabsTrigger>
          <TabsTrigger value="prompt" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            Prompt
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

              <div className="space-y-2 pt-4 border-t">
                <Label>URL do Webhook (Evolution API)</Label>
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-gray-50 font-mono text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={copyWebhookUrl}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Configure esta URL no webhook da Evolution API para receber mensagens
                </p>
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

        <TabsContent value="integrations" className="space-y-4 pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Integração com Asaas</CardTitle>
              <CardDescription>
                Configure o webhook do Asaas para monitorar pagamentos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="asaasWebhookUrl">URL do Webhook Asaas</Label>
                <Input
                  id="asaasWebhookUrl"
                  value={formData.asaasWebhookUrl}
                  onChange={(e) => handleChange("asaasWebhookUrl", e.target.value)}
                  placeholder="https://seu-app.replit.dev/api/asaas/webhook"
                />
                <p className="text-xs text-gray-500">
                  Configure esta URL nas configurações de webhook do Asaas
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium text-gray-700">Eventos monitorados:</p>
                <ul className="text-xs text-gray-600 space-y-1">
                  <li>✅ <strong>PAYMENT_CONFIRMED</strong> - Marca lead como FECHADO</li>
                  <li>✅ <strong>PAYMENT_RECEIVED</strong> - Marca lead como FECHADO</li>
                  <li>⚠️ <strong>PAYMENT_OVERDUE</strong> - Envia lembrete ao lead</li>
                </ul>
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

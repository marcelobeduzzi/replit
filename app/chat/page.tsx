"use client";

import { useState, useRef, useEffect } from "react";
import { DashboardLayout } from "@/app/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/lib/auth-context";
import { Send, Search, PlusCircle, Users, User } from 'lucide-react';

// Datos de ejemplo para usuarios
const usuarios = [
  {
    id: "1",
    nombre: "Juan Pérez",
    rol: "admin",
    avatar: "",
    online: true,
    ultimaConexion: "Ahora",
  },
  {
    id: "2",
    nombre: "María López",
    rol: "manager",
    avatar: "",
    online: true,
    ultimaConexion: "Hace 5 min",
  },
  {
    id: "3",
    nombre: "Carlos Rodríguez",
    rol: "supervisor",
    avatar: "",
    online: false,
    ultimaConexion: "Hace 1 hora",
  },
  {
    id: "4",
    nombre: "Ana Martínez",
    rol: "cashier",
    avatar: "",
    online: false,
    ultimaConexion: "Hace 3 horas",
  },
  {
    id: "5",
    nombre: "Roberto Sánchez",
    rol: "employee",
    avatar: "",
    online: true,
    ultimaConexion: "Ahora",
  },
];

// Datos de ejemplo para chats
const chatsIniciales = [
  {
    id: "1",
    usuario: "1",
    mensajes: [
      {
        id: "1",
        emisor: "1",
        texto: "Hola, ¿cómo estás?",
        fecha: "10:30",
        leido: true,
      },
      {
        id: "2",
        emisor: "current",
        texto: "Bien, gracias. ¿Y tú?",
        fecha: "10:31",
        leido: true,
      },
      {
        id: "3",
        emisor: "1",
        texto: "Todo bien. ¿Necesitas algo?",
        fecha: "10:32",
        leido: true,
      },
    ],
  },
  {
    id: "2",
    usuario: "2",
    mensajes: [
      {
        id: "1",
        emisor: "2",
        texto: "Hola, necesito información sobre el reporte de ventas",
        fecha: "09:15",
        leido: true,
      },
      {
        id: "2",
        emisor: "current",
        texto: "Claro, te lo envío en un momento",
        fecha: "09:20",
        leido: true,
      },
    ],
  },
  {
    id: "3",
    usuario: "3",
    mensajes: [
      {
        id: "1",
        emisor: "3",
        texto: "¿Podemos reunirnos mañana?",
        fecha: "Ayer",
        leido: false,
      },
    ],
  },
];

// Componente para el chat
export default function ChatPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("chats");
  const [searchTerm, setSearchTerm] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [chatActivo, setChatActivo] = useState<string | null>(null);
  const [chats, setChats] = useState(chatsIniciales);
  const mensajesFinRef = useRef<HTMLDivElement>(null);

  // Filtrar usuarios según término de búsqueda
  const filteredUsuarios = usuarios.filter((usuario) =>
    usuario.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Obtener chat activo
  const chatActivoData = chats.find((chat) => chat.id === chatActivo);
  const usuarioActivoData = chatActivoData ? usuarios.find((u) => u.id === chatActivoData.usuario) : null;

  // Desplazar al final de los mensajes cuando cambia el chat activo o se envía un mensaje
  useEffect(() => {
    if (mensajesFinRef.current) {
      mensajesFinRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatActivo, chats]);

  // Enviar mensaje
  const handleEnviarMensaje = () => {
    if (!mensaje.trim() || !chatActivo) return;

    const nuevoMensaje = {
      id: Date.now().toString(),
      emisor: "current",
      texto: mensaje,
      fecha: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      leido: false,
    };

    setChats((prevChats) =>
      prevChats.map((chat) => {
        if (chat.id === chatActivo) {
          return {
            ...chat,
            mensajes: [...chat.mensajes, nuevoMensaje],
          };
        }
        return chat;
      })
    );

    setMensaje("");
  };

  // Iniciar nuevo chat
  const handleIniciarChat = (usuarioId: string) => {
    // Verificar si ya existe un chat con este usuario
    const chatExistente = chats.find((chat) => chat.usuario === usuarioId);
    
    if (chatExistente) {
      setChatActivo(chatExistente.id);
      setActiveTab("chats");
      return;
    }

    // Crear nuevo chat
    const nuevoChat = {
      id: Date.now().toString(),
      usuario: usuarioId,
      mensajes: [],
    };

    setChats((prevChats) => [...prevChats, nuevoChat]);
    setChatActivo(nuevoChat.id);
    setActiveTab("chats");
  };

  // Renderizar contenido de la pestaña de chats
  const renderChatsContent = () => (
    <ScrollArea className="h-[calc(100vh-320px)]">
      <div className="px-4 py-2 space-y-2">
        {chats.map((chat) => {
          const usuario = usuarios.find((u) => u.id === chat.usuario);
          const ultimoMensaje = chat.mensajes[chat.mensajes.length - 1];
          const mensajesNoLeidos = chat.mensajes.filter(
            (m) => m.emisor !== "current" && !m.leido
          ).length;

          return (
            <div
              key={chat.id}
              className={`flex items-center p-2 rounded-md cursor-pointer ${
                chatActivo === chat.id ? "bg-accent" : "hover:bg-accent/50"
              }`}
              onClick={() => setChatActivo(chat.id)}
            >
              <Avatar className="h-10 w-10 mr-3">
                <AvatarImage src={usuario?.avatar} />
                <AvatarFallback>{usuario?.nombre.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium truncate">{usuario?.nombre}</p>
                  <p className="text-xs text-muted-foreground">{ultimoMensaje?.fecha}</p>
                </div>
                <p className="text-xs truncate text-muted-foreground">
                  {ultimoMensaje?.texto || "Iniciar conversación"}
                </p>
              </div>
              {mensajesNoLeidos > 0 && (
                <div className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 flex items-center justify-center text-xs">
                  {mensajesNoLeidos}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );

  // Renderizar contenido de la pestaña de usuarios
  const renderUsuariosContent = () => (
    <ScrollArea className="h-[calc(100vh-320px)]">
      <div className="px-4 py-2 space-y-2">
        {filteredUsuarios.map((usuario) => (
          <div
            key={usuario.id}
            className="flex items-center p-2 rounded-md cursor-pointer hover:bg-accent/50"
            onClick={() => handleIniciarChat(usuario.id)}
          >
            <Avatar className="h-10 w-10 mr-3">
              <AvatarImage src={usuario.avatar} />
              <AvatarFallback>{usuario.nombre.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium truncate">{usuario.nombre}</p>
                <div
                  className={`w-2 h-2 rounded-full ${
                    usuario.online ? "bg-green-500" : "bg-gray-300"
                  }`}
                ></div>
              </div>
              <p className="text-xs truncate text-muted-foreground">
                {usuario.online ? "En línea" : usuario.ultimaConexion}
              </p>
            </div>
            <Button variant="ghost" size="icon" className="ml-2">
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  return (
    <DashboardLayout>
      <div className="flex-1 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Chat Interno</h2>
            <p className="text-muted-foreground">Comunícate con otros miembros del equipo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-220px)]">
          {/* Panel lateral */}
          <Card className="md:col-span-1">
            <CardHeader className="pb-3">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="chats">
                    <div className="flex items-center">
                      <Users className="mr-2 h-4 w-4" />
                      Chats
                    </div>
                  </TabsTrigger>
                  <TabsTrigger value="usuarios">
                    <div className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      Usuarios
                    </div>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="chats" className="m-0">
                  {renderChatsContent()}
                </TabsContent>

                <TabsContent value="usuarios" className="m-0">
                  {renderUsuariosContent()}
                </TabsContent>
              </Tabs>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-4 py-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Área de chat */}
          <Card className="md:col-span-2">
            {chatActivo && usuarioActivoData ? (
              <>
                <CardHeader className="pb-3 border-b">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 mr-3">
                      <AvatarImage src={usuarioActivoData.avatar} />
                      <AvatarFallback>{usuarioActivoData.nombre.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{usuarioActivoData.nombre}</CardTitle>
                      <CardDescription>
                        {usuarioActivoData.online ? "En línea" : usuarioActivoData.ultimaConexion}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 flex flex-col h-[calc(100vh-380px)]">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {chatActivoData.mensajes.map((mensaje) => (
                        <div
                          key={mensaje.id}
                          className={`flex ${mensaje.emisor === "current" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              mensaje.emisor === "current"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{mensaje.texto}</p>
                            <p className="text-xs text-right mt-1 opacity-70">{mensaje.fecha}</p>
                          </div>
                        </div>
                      ))}
                      <div ref={mensajesFinRef} />
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t">
                    <div className="flex items-center space-x-2">
                      <Input
                        placeholder="Escribe un mensaje..."
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleEnviarMensaje();
                          }
                        }}
                      />
                      <Button size="icon" onClick={handleEnviarMensaje}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <div className="h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">Selecciona un chat</h3>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Elige un chat existente o inicia una nueva conversación con un usuario.
                  </p>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
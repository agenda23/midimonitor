import type { MetaFunction } from "@remix-run/node";
import { useState, useEffect } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "MIDI Monitor" },
    { name: "description", content: "MIDIコントローラ入力モニターアプリ" },
  ];
};

interface MIDIMessage {
  timestamp: number;
  channel: number;
  type: string;
  data: number[];
  note?: number;
  velocity?: number;
  controller?: number;
  value?: number;
  port?: string;
}

export default function Index() {
  const [midiAccess, setMidiAccess] = useState<MIDIAccess | null>(null);
  const [selectedPort, setSelectedPort] = useState<string>("");
  const [messages, setMessages] = useState<MIDIMessage[]>([]);
  const [error, setError] = useState<string>("");
  const [channelFilter, setChannelFilter] = useState<number | null>(null);
  const [messageTypeFilter, setMessageTypeFilter] = useState<string>("");

  useEffect(() => {
    if (typeof window !== "undefined" && "navigator" in window && "requestMIDIAccess" in navigator) {
      navigator.requestMIDIAccess().then((access) => {
        setMidiAccess(access);
        if (access.inputs.size > 0) {
          const firstInput = Array.from(access.inputs.values())[0];
          setSelectedPort(firstInput.id);
        }
      }).catch((err) => {
        setError("WebMIDI APIにアクセスできません: " + err.message);
      });
    } else {
      setError("WebMIDI APIがサポートされていません。Chromeなど対応ブラウザをお使いください。");
    }
  }, []);

  useEffect(() => {
    if (midiAccess && selectedPort) {
      const input = midiAccess.inputs.get(selectedPort);
      if (input) {
        const handleMIDIMessage = (event: MIDIMessageEvent) => {
          const data = Array.from(event.data);
          const [status, data1, data2] = data;
          
          const channel = (status & 0x0F) + 1;
          const messageType = status & 0xF0;
          
          let type = "";
          let note, velocity, controller, value;
          
          switch (messageType) {
            case 0x90:
              type = data2 > 0 ? "Note On" : "Note Off";
              note = data1;
              velocity = data2;
              break;
            case 0x80:
              type = "Note Off";
              note = data1;
              velocity = data2;
              break;
            case 0xB0:
              type = "Control Change";
              controller = data1;
              value = data2;
              break;
            case 0xC0:
              type = "Program Change";
              value = data1;
              break;
            case 0xE0:
              type = "Pitch Bend";
              value = (data2 << 7) | data1;
              break;
            default:
              type = `Unknown (0x${messageType.toString(16)})`;
          }
          
          const message: MIDIMessage = {
            timestamp: Date.now(),
            channel,
            type,
            data,
            note,
            velocity,
            controller,
            value,
            port: input.name
          };
          
          setMessages(prev => [message, ...prev].slice(0, 1000));
        };
        
        input.onmidimessage = handleMIDIMessage;
        
        return () => {
          input.onmidimessage = null;
        };
      }
    }
  }, [midiAccess, selectedPort]);

  const ports = midiAccess ? Array.from(midiAccess.inputs.values()) : [];

  const filteredMessages = messages.filter(msg => {
    if (channelFilter !== null && msg.channel !== channelFilter) return false;
    if (messageTypeFilter && msg.type !== messageTypeFilter) return false;
    return true;
  });

  const uniqueMessageTypes = [...new Set(messages.map(msg => msg.type))];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="container mx-auto p-6">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            MIDI Monitor
          </h1>
          <p className="text-center text-gray-400">MIDIコントローラ入力モニターアプリ</p>
        </header>

        {error && (
          <div className="bg-red-600 text-white p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">MIDIポート選択:</label>
            <select
              value={selectedPort}
              onChange={(e) => setSelectedPort(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">ポートを選択してください</option>
              {ports.map((port) => (
                <option key={port.id} value={port.id}>
                  {port.name} ({port.manufacturer})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">チャンネルフィルター:</label>
            <select
              value={channelFilter ?? ""}
              onChange={(e) => setChannelFilter(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">全チャンネル</option>
              {Array.from({ length: 16 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
                  チャンネル {i + 1}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">メッセージタイプフィルター:</label>
            <select
              value={messageTypeFilter}
              onChange={(e) => setMessageTypeFilter(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white"
            >
              <option value="">全タイプ</option>
              {uniqueMessageTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">メッセージログ</h2>
            <div className="h-96 overflow-y-auto bg-black rounded-lg p-4 font-mono text-sm">
              {filteredMessages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  {messages.length === 0 ? "MIDIメッセージを待機中..." : "フィルター条件に一致するメッセージがありません"}
                </div>
              ) : (
                filteredMessages.map((msg, index) => (
                  <div key={index} className="mb-2 border-b border-gray-700 pb-2">
                    <div className="text-gray-400 text-xs">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </div>
                    <div className="text-white">
                      Ch{msg.channel} {msg.type}
                      {msg.note !== undefined && ` Note:${msg.note}`}
                      {msg.velocity !== undefined && ` Vel:${msg.velocity}`}
                      {msg.controller !== undefined && ` CC:${msg.controller}`}
                      {msg.value !== undefined && ` Value:${msg.value}`}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Raw: [{msg.data.join(", ")}] | Port: {msg.port}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">グラフィカル表示</h2>
            <div className="h-96 bg-black rounded-lg p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="text-gray-500 text-center py-8">
                  MIDIメッセージを受信すると動的に表示されます
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Control Change ノブ表示 */}
                  {(() => {
                    const ccMessages = messages.filter(msg => msg.type === "Control Change");
                    const uniqueCCs = [...new Set(ccMessages.map(msg => `${msg.channel}-${msg.controller}`))];
                    
                    return uniqueCCs.length > 0 ? (
                      <div>
                        <h3 className="text-sm text-gray-400 mb-2">Control Change</h3>
                        <div className="grid grid-cols-4 gap-4">
                          {uniqueCCs.slice(0, 12).map(ccKey => {
                            const [channel, controller] = ccKey.split('-').map(Number);
                            const latestCC = ccMessages
                              .filter(msg => msg.channel === channel && msg.controller === controller)
                              .sort((a, b) => b.timestamp - a.timestamp)[0];
                            
                            return (
                              <div key={ccKey} className="text-center">
                                <div className="relative w-16 h-16 mx-auto mb-2">
                                  <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#374151"
                                      strokeWidth="8"
                                      fill="none"
                                    />
                                    <circle
                                      cx="50"
                                      cy="50"
                                      r="40"
                                      stroke="#3B82F6"
                                      strokeWidth="8"
                                      fill="none"
                                      strokeDasharray={`${((latestCC?.value || 0) / 127) * 251.2} 251.2`}
                                      strokeLinecap="round"
                                    />
                                  </svg>
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-xs font-mono text-white">
                                      {latestCC?.value || 0}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-400">
                                  Ch{channel} CC{controller}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* Note On/Off ボタン表示 */}
                  {(() => {
                    const noteMessages = messages.filter(msg => msg.type === "Note On" || msg.type === "Note Off");
                    const uniqueNotes = [...new Set(noteMessages.map(msg => `${msg.channel}-${msg.note}`))];
                    
                    return uniqueNotes.length > 0 ? (
                      <div>
                        <h3 className="text-sm text-gray-400 mb-2">Notes</h3>
                        <div className="grid grid-cols-8 gap-2">
                          {uniqueNotes.slice(0, 24).map(noteKey => {
                            const [channel, note] = noteKey.split('-').map(Number);
                            const latestNote = noteMessages
                              .filter(msg => msg.channel === channel && msg.note === note)
                              .sort((a, b) => b.timestamp - a.timestamp)[0];
                            
                            const isActive = latestNote?.type === "Note On" && (latestNote?.velocity || 0) > 0;
                            
                            return (
                              <div key={noteKey} className="text-center">
                                <div
                                  className={`w-8 h-8 mx-auto rounded transition-all duration-150 ${
                                    isActive
                                      ? "bg-green-400 shadow-lg shadow-green-400/50"
                                      : "bg-gray-600"
                                  }`}
                                />
                                <div className="text-xs text-gray-400 mt-1">
                                  Ch{channel}
                                </div>
                                <div className="text-xs text-gray-400">
                                  Note{note}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : null;
                  })()}

                  {/* その他のメッセージ表示 */}
                  {(() => {
                    const otherMessages = messages.filter(msg => 
                      msg.type !== "Control Change" && 
                      msg.type !== "Note On" && 
                      msg.type !== "Note Off"
                    );
                    const recentOthers = otherMessages.slice(0, 5);
                    
                    return recentOthers.length > 0 ? (
                      <div>
                        <h3 className="text-sm text-gray-400 mb-2">その他のメッセージ</h3>
                        <div className="space-y-2">
                          {recentOthers.map((msg, index) => (
                            <div key={index} className="bg-gray-700 rounded px-3 py-2 text-sm">
                              <div className="text-white">
                                Ch{msg.channel} {msg.type}
                                {msg.value !== undefined && ` Value:${msg.value}`}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null;
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex gap-4">
          <button
            onClick={() => setMessages([])}
            className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors"
          >
            ログクリア
          </button>
          <button
            onClick={() => {
              const json = JSON.stringify(messages, null, 2);
              const blob = new Blob([json], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `midi-log-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
            }}
            className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
          >
            JSONエクスポート
          </button>
        </div>
      </div>
    </div>
  );
}

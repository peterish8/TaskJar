"use client";

import type React from "react";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertTriangle, Edit3, Download, Upload } from "lucide-react";
import type { AppSettings } from "../types";

interface SettingsPageProps {
  settings: AppSettings;
  setSettings: React.Dispatch<React.SetStateAction<AppSettings>>;
  playSound: (type: "click" | "complete" | "generate") => void;
  onClearAllData: () => void;
}

export default function SettingsPage({
  settings,
  setSettings,
  playSound,
  onClearAllData,
}: SettingsPageProps) {
  const [parentPassword, setParentPassword] = useState("");
  const [isParentUnlocked, setIsParentUnlocked] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [clearPassword, setClearPassword] = useState("");
  const [showPasswordRecovery, setShowPasswordRecovery] = useState(false);
  const [recoveryAnswer, setRecoveryAnswer] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [showNameEdit, setShowNameEdit] = useState(false);
  const [tempName, setTempName] = useState(settings.studentName);

  const securityQuestions = [
    "What is your date of birth? (DD/MM/YYYY)",
    "What is your mother's maiden name?",
    "What was the name of your first pet?",
    "In which city were you born?",
    "What is your favorite color?",
    "What was your first car?",
    "What is your favorite food?",
  ];

  const checkParentPassword = () => {
    playSound("click");
    if (
      parentPassword === settings.parentLock.password ||
      !settings.parentLock.enabled
    ) {
      setIsParentUnlocked(true);
      setParentPassword("");
    }
  };

  const handlePasswordRecovery = () => {
    if (
      recoveryAnswer.toLowerCase().trim() ===
      settings.parentLock.securityAnswer.toLowerCase().trim()
    ) {
      if (newPassword.trim()) {
        setSettings((prev) => ({
          ...prev,
          parentLock: {
            ...prev.parentLock,
            password: newPassword,
          },
        }));
        setShowPasswordRecovery(false);
        setRecoveryAnswer("");
        setNewPassword("");
        setIsParentUnlocked(true);
        playSound("complete");
      }
    } else {
      playSound("click");
      alert("Incorrect answer. Please try again.");
    }
  };

  const handleClearData = () => {
    if (clearPassword === settings.parentLock.password) {
      onClearAllData();
      setShowClearConfirm(false);
      setClearPassword("");
      playSound("complete");
    } else {
      playSound("click");
      alert("Incorrect password. Data not cleared.");
    }
  };

  const handleNameSave = () => {
    setSettings((prev) => ({
      ...prev,
      studentName: tempName || "Student",
    }));
    setShowNameEdit(false);
    playSound("click");
  };

  const exportData = () => {
    playSound("click");
    const allData = {
      tasks: JSON.parse(localStorage.getItem("taskjar_tasks") || "[]"),
      jars: JSON.parse(localStorage.getItem("taskjar_jars") || "[]"),
      settings: JSON.parse(localStorage.getItem("taskjar_settings") || "{}"),
      exportDate: new Date().toISOString(),
    };

    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `taskjar-backup-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    playSound("click");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedData = JSON.parse(e.target?.result as string);

        if (importedData.tasks)
          localStorage.setItem(
            "taskjar_tasks",
            JSON.stringify(importedData.tasks)
          );
        if (importedData.jars)
          localStorage.setItem(
            "taskjar_jars",
            JSON.stringify(importedData.jars)
          );
        if (importedData.settings) {
          localStorage.setItem(
            "taskjar_settings",
            JSON.stringify(importedData.settings)
          );
          setSettings(importedData.settings);
        }

        playSound("complete");
        alert(
          "Data imported successfully! Please refresh the page to see changes."
        );
      } catch (error) {
        playSound("click");
        alert("Invalid backup file. Please select a valid TaskJar backup.");
      }
    };
    reader.readAsText(file);
    event.target.value = ""; // Reset input
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex w-full bg-gray-800/50 p-1 rounded-md">
          <TabsTrigger
            value="general"
            onClick={() => playSound("click")}
            className="flex-1 flex-shrink-0 px-4 py-2 text-center font-mono tracking-wider data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md transition-all"
          >
            General
          </TabsTrigger>
          <TabsTrigger
            value="emojis"
            onClick={() => playSound("click")}
            className="flex-1 flex-shrink-0 px-4 py-2 text-center font-mono tracking-wider data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md transition-all"
          >
            Emojis
          </TabsTrigger>
          <TabsTrigger
            value="parent"
            onClick={() => playSound("click")}
            className="flex-1 flex-shrink-0 px-4 py-2 text-center font-mono tracking-wider data-[state=active]:bg-muted data-[state=active]:text-foreground rounded-md transition-all"
          >
            P Lock
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle>User Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="font-medium">User Name</Label>
                <div className="flex items-center gap-2">
                  <Input
                    value={settings.studentName || ""}
                    readOnly
                    className="bg-white/10 border-white/20 text-white flex-1"
                    placeholder="User Name"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      playSound("click");
                      setTempName(settings.studentName);
                      setShowNameEdit(true);
                    }}
                    className="border-white/20 hover:bg-white/10"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="font-medium">Sound Effects</Label>
                <Button
                  variant={
                    settings.preferences.soundEnabled ? "default" : "outline"
                  }
                  size="sm"
                  onClick={() => {
                    playSound("click");
                    setSettings((prev) => ({
                      ...prev,
                      preferences: {
                        ...prev.preferences,
                        soundEnabled: !prev.preferences.soundEnabled,
                      },
                    }));
                  }}
                >
                  {settings.preferences.soundEnabled ? "On" : "Off"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle>Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button
                  onClick={exportData}
                  className="bg-blue-600 hover:bg-blue-700 flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export Data
                </Button>
                <div className="flex-1">
                  <input
                    type="file"
                    accept=".json"
                    onChange={importData}
                    className="hidden"
                    id="import-file"
                  />
                  <Button
                    onClick={() =>
                      document.getElementById("import-file")?.click()
                    }
                    className="bg-green-600 hover:bg-green-700 w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Import Data
                  </Button>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Export your data as a backup file or import from a previous
                backup.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="emojis" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="matrix-font">Emoji Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">
                  Difficulty Emojis (How Hard)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.difficulty.light}
                    </span>
                    <span>Light - Quick & easy tasks</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.difficulty.standard}
                    </span>
                    <span>Standard - Normal effort needed</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.difficulty.challenging}
                    </span>
                    <span>Challenging - Hard work required</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-semibold mb-2">
                  Priority Emojis (How Important/Urgent)
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.priority.optional}
                    </span>
                    <span>Optional - When you have time</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.priority.scheduled}
                    </span>
                    <span>Scheduled - Has a deadline</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {settings.emojis.priority.urgent}
                    </span>
                    <span>Urgent - Must do now/ASAP</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-3 bg-green-900/30 rounded-lg">
                <p className="text-sm text-green-200">
                  <strong>Display Format:</strong> Every task shows
                  [Difficulty][Priority] emojis
                </p>
                <p className="text-sm text-green-200 mt-1">
                  Example: {settings.emojis.difficulty.challenging}
                  {settings.emojis.priority.urgent} = Hard task, urgent deadline
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="parent" className="space-y-4">
          <Card className="bg-white/10 backdrop-blur-md border-white/20">
            <CardHeader>
              <CardTitle className="matrix-font">
                Parent Lock Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!settings.parentLock.enabled ? (
                <div className="space-y-4">
                  <p className="text-sm text-gray-300">
                    Set up parent lock to protect XP values and advanced
                    settings.
                  </p>
                  <div className="space-y-2">
                    <Label className="font-medium">Set Password</Label>
                    <Input
                      type="password"
                      value={parentPassword || ""}
                      onChange={(e) => setParentPassword(e.target.value || "")}
                      className="bg-white/10 border-white/20"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Security Question</Label>
                    <Select
                      value={securityQuestion}
                      onValueChange={setSecurityQuestion}
                    >
                      <SelectTrigger className="bg-white/10 border-white/20">
                        <SelectValue placeholder="Choose a security question" />
                      </SelectTrigger>
                      <SelectContent>
                        {securityQuestions.map((question, index) => (
                          <SelectItem key={index} value={question}>
                            {question}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-medium">Security Answer</Label>
                    <Input
                      type="text"
                      value={securityAnswer}
                      onChange={(e) => setSecurityAnswer(e.target.value)}
                      className="bg-white/10 border-white/20"
                      placeholder="Your Answer"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      playSound("click");
                      if (
                        parentPassword.trim() &&
                        securityQuestion &&
                        securityAnswer.trim()
                      ) {
                        setSettings((prev) => ({
                          ...prev,
                          parentLock: {
                            enabled: true,
                            password: parentPassword,
                            securityQuestion: securityQuestion,
                            securityAnswer: securityAnswer,
                          },
                        }));
                        setParentPassword("");
                        setSecurityQuestion("");
                        setSecurityAnswer("");
                      }
                    }}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    Enable Parent Lock
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {!isParentUnlocked ? (
                    <div className="space-y-4">
                      <p className="text-sm text-gray-300">
                        Parent lock is enabled. Enter password to access
                        protected settings.
                      </p>
                      <div className="space-y-2">
                        <Label className="font-medium">Password</Label>
                        <Input
                          type="password"
                          value={parentPassword || ""}
                          onChange={(e) =>
                            setParentPassword(e.target.value || "")
                          }
                          className="bg-white/10 border-white/20"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={checkParentPassword}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Unlock Settings
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => setShowPasswordRecovery(true)}
                          className="border-white/20"
                        >
                          Forgot Password?
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm text-green-300">
                        Settings unlocked!
                      </p>

                      <div>
                        <h4 className="font-semibold mb-3 matrix-font">
                          XP Values & Emojis
                        </h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">
                              Light Tasks XP
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={settings.xpValues.light || 5}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  xpValues: {
                                    ...prev.xpValues,
                                    light: Math.max(
                                      1,
                                      Math.min(
                                        100,
                                        Number.parseInt(e.target.value) || 5
                                      )
                                    ),
                                  },
                                }))
                              }
                              className="w-20 bg-white/10 border-white/20 text-center"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">
                              Standard Tasks XP
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={settings.xpValues.standard || 10}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  xpValues: {
                                    ...prev.xpValues,
                                    standard: Math.max(
                                      1,
                                      Math.min(
                                        100,
                                        Number.parseInt(e.target.value) || 10
                                      )
                                    ),
                                  },
                                }))
                              }
                              className="w-20 bg-white/10 border-white/20 text-center"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">
                              Challenging Tasks XP
                            </Label>
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              value={settings.xpValues.challenging || 15}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  xpValues: {
                                    ...prev.xpValues,
                                    challenging: Math.max(
                                      1,
                                      Math.min(
                                        100,
                                        Number.parseInt(e.target.value) || 15
                                      )
                                    ),
                                  },
                                }))
                              }
                              className="w-20 bg-white/10 border-white/20 text-center"
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label className="font-medium">
                              XP Required per Jar
                            </Label>
                            <Input
                              type="number"
                              min="50"
                              max="500"
                              value={settings.jarTarget || 100}
                              onChange={(e) =>
                                setSettings((prev) => ({
                                  ...prev,
                                  jarTarget: Math.max(
                                    50,
                                    Math.min(
                                      500,
                                      Number.parseInt(e.target.value) || 100
                                    )
                                  ),
                                }))
                              }
                              className="w-20 bg-white/10 border-white/20 text-center"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Danger Zone - Now under Parent Lock */}
                      <Card className="bg-red-900/20 border-red-500/30">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2 text-red-400 matrix-font">
                            <AlertTriangle className="w-5 h-5" />
                            Danger Zone
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-4">
                            <p className="text-sm text-red-300">
                              This will permanently delete all your tasks, jars,
                              and progress. This action cannot be undone.
                            </p>
                            <Button
                              variant="destructive"
                              onClick={() => {
                                playSound("click");
                                setShowClearConfirm(true);
                              }}
                            >
                              Clear All Data
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      <Button
                        variant="outline"
                        onClick={() => {
                          playSound("click");
                          setIsParentUnlocked(false);
                        }}
                        className="border-white/20"
                      >
                        Lock Settings
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Name Edit Dialog */}
      <Dialog open={showNameEdit} onOpenChange={setShowNameEdit}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Edit User Name</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="matrix-font">User Name</Label>
              <Input
                value={tempName}
                onChange={(e) => setTempName(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
                placeholder="User Name"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowNameEdit(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handleNameSave}
                className="bg-green-600 hover:bg-green-700"
              >
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Clear Data Confirmation Dialog */}
      <Dialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-5 h-5" />
              Confirm Data Deletion
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-300">
              Are you absolutely sure you want to delete all data? This will
              permanently remove:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
              <li>All completed and pending tasks</li>
              <li>All jar progress and completed jars</li>
              <li>Complete task history</li>
              <li>All progress statistics</li>
            </ul>
            <p className="text-red-300 font-semibold">
              This action cannot be undone!
            </p>

            <div className="space-y-2">
              <Label className="matrix-font">
                Enter Parent Password to Confirm
              </Label>
              <Input
                type="password"
                value={clearPassword}
                onChange={(e) => setClearPassword(e.target.value)}
                className="bg-white/10 border-white/20"
                placeholder="Parent Password"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowClearConfirm(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleClearData}
                disabled={!clearPassword}
              >
                Delete All Data
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Recovery Dialog */}
      <Dialog
        open={showPasswordRecovery}
        onOpenChange={setShowPasswordRecovery}
      >
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogHeader>
            <DialogTitle>Password Recovery</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="matrix-font">Security Question</Label>
              <p className="text-sm text-gray-300 bg-white/10 p-2 rounded">
                {settings.parentLock.securityQuestion}
              </p>
            </div>
            <div className="space-y-2">
              <Label className="matrix-font">Your Answer</Label>
              <Input
                type="text"
                value={recoveryAnswer}
                onChange={(e) => setRecoveryAnswer(e.target.value)}
                className="bg-white/10 border-white/20"
                placeholder="Your Answer"
              />
            </div>
            <div className="space-y-2">
              <Label className="matrix-font">New Password</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="bg-white/10 border-white/20"
                placeholder="New Password"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowPasswordRecovery(false)}
                className="border-white/20"
              >
                Cancel
              </Button>
              <Button
                onClick={handlePasswordRecovery}
                disabled={!recoveryAnswer || !newPassword}
                className="bg-green-600 hover:bg-green-700"
              >
                Reset Password
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

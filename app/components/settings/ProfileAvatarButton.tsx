"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { UserProfile } from "../../types";
import { load, save, STORAGE_KEYS } from "@/lib/storage";
import { loadDailyCompletion, normalizeLast30Days, type DailyCompletion } from "@/lib/analytics";

interface ProfileAvatarButtonProps {
  playSound: (type: "click" | "complete" | "generate") => void;
}

const PRESET_COLORS = [
  "#1DB954", // Spotify green
  "#3B82F6", // Blue
  "#8B5CF6", // Purple
  "#F59E0B", // Amber
  "#EF4444", // Red
  "#10B981", // Emerald
  "#F97316", // Orange
  "#EC4899", // Pink
];

export default function ProfileAvatarButton({ playSound }: ProfileAvatarButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [profile, setProfile] = useState<UserProfile>({ initials: "T", bgColor: "#1DB954" });
  const [tempProfile, setTempProfile] = useState<UserProfile>({ initials: "T", bgColor: "#1DB954" });
  const [alert, setAlert] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [alertProgress, setAlertProgress] = useState(100);
  const [analyticsData, setAnalyticsData] = useState<DailyCompletion[]>([]);

  // Load profile on mount
  useEffect(() => {
    const savedProfile = load<UserProfile>(STORAGE_KEYS.PROFILE_INITIALS, { initials: "T", bgColor: "#1DB954" });
    const savedColor = load<string>(STORAGE_KEYS.PROFILE_BG_COLOR, "#1DB954");
    
    const fullProfile: UserProfile = {
      initials: savedProfile.initials || "T",
      bgColor: savedColor
    };
    
    setProfile(fullProfile);
    setTempProfile(fullProfile);
  }, []);

  // Load analytics data
  useEffect(() => {
    const data = loadDailyCompletion();
    const normalized = normalizeLast30Days(data);
    setAnalyticsData(normalized);
  }, []);

  // Alert auto-dismiss
  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => {
        setAlert(null);
        setAlertProgress(100);
      }, 8000);

      const progressTimer = setInterval(() => {
        setAlertProgress(prev => Math.max(0, prev - (100 / 80))); // 8 seconds = 80 intervals
      }, 100);

      return () => {
        clearTimeout(timer);
        clearInterval(progressTimer);
      };
    }
  }, [alert]);

  const showAlert = (message: string, type: 'success' | 'error' = 'success') => {
    setAlert({ message, type });
    setAlertProgress(100);
  };

  const validateInitials = (initials: string): boolean => {
    const regex = /^[A-Z0-9]{1,2}$/;
    return regex.test(initials.toUpperCase());
  };

  const handleInitialsChange = (value: string) => {
    const upperValue = value.toUpperCase();
    setTempProfile(prev => ({ ...prev, initials: upperValue }));
  };

  const handleInitialsBlur = () => {
    if (!validateInitials(tempProfile.initials)) {
      showAlert("Please use 1–2 letters or numbers (A–Z, 0–9).", "error");
      setTempProfile(prev => ({ ...prev, initials: profile.initials }));
    } else {
      setProfile(tempProfile);
      save(STORAGE_KEYS.PROFILE_INITIALS, tempProfile);
      save(STORAGE_KEYS.PROFILE_BG_COLOR, tempProfile.bgColor);
    }
  };

  const handleColorChange = (color: string) => {
    setTempProfile(prev => ({ ...prev, bgColor: color }));
    setProfile(prev => ({ ...prev, bgColor: color }));
    save(STORAGE_KEYS.PROFILE_BG_COLOR, color);
  };

  const handleSave = () => {
    if (!validateInitials(tempProfile.initials)) {
      showAlert("Please use 1–2 letters or numbers (A–Z, 0–9).", "error");
      return;
    }

    setProfile(tempProfile);
    save(STORAGE_KEYS.PROFILE_INITIALS, tempProfile);
    save(STORAGE_KEYS.PROFILE_BG_COLOR, tempProfile.bgColor);
    showAlert("Profile updated successfully!");
  };

  const formatChartData = (data: DailyCompletion[]) => {
    return data.map(item => ({
      date: new Date(item.dateISO).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }),
      completion: item.completionPct,
      dateISO: item.dateISO
    }));
  };

  const getSegmentColor = (data: any[], index: number) => {
    if (index === 0) return "#1DB954"; // First point is green
    
    const current = data[index].completion;
    const previous = data[index - 1].completion;
    
    if (current > previous) return "#1DB954"; // Green for upward
    if (current < previous) return "#EF4444"; // Red for downward
    return "#F59E0B"; // Yellow for flat
  };

  const chartData = formatChartData(analyticsData);

  return (
    <>
      {/* Avatar Button */}
      <Button
        onClick={() => {
          setIsOpen(true);
          playSound("click");
        }}
        className="w-10 h-10 rounded-full p-0 flex items-center justify-center font-bold text-white shadow-lg hover:shadow-xl transition-all duration-200"
        style={{ backgroundColor: profile.bgColor }}
        aria-label="Open profile settings"
      >
        {profile.initials}
      </Button>

      {/* Dynamic Island Popup */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 20 }}
              className="relative"
              onClick={(e) => e.stopPropagation()}
            >
              <Card className="bg-black/90 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-lg"
                        style={{ backgroundColor: tempProfile.bgColor }}
                      >
                        {tempProfile.initials}
                      </div>
                      <div>
                        <CardTitle className="text-white">Profile Settings</CardTitle>
                        <p className="text-gray-400 text-sm">Customize your avatar</p>
                      </div>
                    </div>
                    <Button
                      onClick={() => setIsOpen(false)}
                      variant="ghost"
                      size="sm"
                      className="text-gray-400 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  {!isExpanded ? (
                    // Compact State - Profile Editing
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {/* Initials Input */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Initials</label>
                        <Input
                          value={tempProfile.initials}
                          onChange={(e) => handleInitialsChange(e.target.value)}
                          onBlur={handleInitialsBlur}
                          maxLength={2}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          placeholder="Enter 1-2 characters"
                        />
                        <p className="text-xs text-gray-400">
                          Use 1–2 letters or numbers (A–Z, 0–9)
                        </p>
                      </div>

                      {/* Color Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300">Profile Color</label>
                        <div className="grid grid-cols-4 gap-2">
                          {PRESET_COLORS.map((color) => (
                            <button
                              key={color}
                              onClick={() => handleColorChange(color)}
                              className={`w-8 h-8 rounded-full border-2 transition-all ${
                                tempProfile.bgColor === color
                                  ? "border-white scale-110"
                                  : "border-white/20 hover:border-white/50"
                              }`}
                              style={{ backgroundColor: color }}
                            />
                          ))}
                        </div>
                        <Input
                          value={tempProfile.bgColor}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
                          placeholder="#RRGGBB"
                        />
                      </div>

                      {/* Save Button */}
                      <Button
                        onClick={handleSave}
                        className="w-full bg-green-600 hover:bg-green-700 font-bold"
                      >
                        Save Changes
                      </Button>

                      {/* Expand Button */}
                      <Button
                        onClick={() => setIsExpanded(true)}
                        variant="outline"
                        className="w-full border-white/20 text-white hover:bg-white/10"
                      >
                        <ChevronUp className="w-4 h-4 mr-2" />
                        View Analytics
                      </Button>
                    </motion.div>
                  ) : (
                    // Expanded State - Analytics
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-white">Completion Analytics</h3>
                        <Button
                          onClick={() => setIsExpanded(false)}
                          variant="ghost"
                          size="sm"
                          className="text-gray-400 hover:text-white"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                      </div>

                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                            <XAxis 
                              dataKey="date" 
                              stroke="#9CA3AF"
                              fontSize={12}
                            />
                            <YAxis 
                              stroke="#9CA3AF"
                              fontSize={12}
                              domain={[0, 100]}
                            />
                            <Tooltip
                              contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "1px solid #374151",
                                borderRadius: "8px",
                                color: "#F9FAFB"
                              }}
                            />
                            {chartData.map((entry, index) => (
                              <Line
                                key={index}
                                type="monotone"
                                dataKey="completion"
                                stroke={getSegmentColor(chartData, index)}
                                strokeWidth={3}
                                dot={{ fill: getSegmentColor(chartData, index), strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, stroke: "#FFFFFF", strokeWidth: 2 }}
                                connectNulls={false}
                              />
                            ))}
                          </LineChart>
                        </ResponsiveContainer>
                      </div>

                      <div className="flex gap-2 text-xs text-gray-400">
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                          <span>Improving</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <span>Declining</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <span>Stable</span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert */}
      {alert && (
        <div className="fixed bottom-6 left-6 right-6 z-50">
          <div className={`p-4 rounded-lg border ${
            alert.type === 'success' 
              ? 'bg-green-600/90 border-green-500 text-white' 
              : 'bg-red-600/90 border-red-500 text-white'
          }`}>
            <div className="flex items-center justify-between">
              <span>{alert.message}</span>
              <Button
                onClick={() => setAlert(null)}
                variant="ghost"
                size="sm"
                className="text-white hover:text-white/80"
              >
                ×
              </Button>
            </div>
            <div className="mt-2 w-full bg-white/20 rounded-full h-1">
              <div 
                className="bg-white h-1 rounded-full transition-all duration-100"
                style={{ width: `${alertProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
} 
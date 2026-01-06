import { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  X,
  Edit2,
  Check,
  Settings,
} from "lucide-react";

interface Task {
  id: number;
  text: string;
  minutes: number;
  seconds: number;
  timeLeft: number;
  isRunning: boolean;
  originalTime: number;
  alarmPlayed: boolean;
  startTime?: number;
}

interface AlarmSound {
  name: string;
  url: string;
}

type AlarmType =
  | "alarm1"
  | "alarm2"
  | "alarm3"
  | "alarm4"
  | "alarm5"
  | "alarm6"
  | "alarm7"
  | "alarm8"
  | "alarm9"
  | "alarm10";

export default function KanbanTimer() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTaskText, setNewTaskText] = useState<string>("");
  const [editingTaskId, setEditingTaskId] = useState<number | null>(null);
  const [editText, setEditText] = useState<string>("");
  const [showSettings, setShowSettings] = useState<boolean>(false);
  const [selectedAlarm, setSelectedAlarm] = useState<AlarmType>("alarm1");
  const [alarmInterval, setAlarmInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load data from localStorage on mount
  useEffect(() => {
    const savedTasks = JSON.parse(
      localStorage.getItem("kanbanTasks") || "[]"
    ) as Task[];
    const savedAlarm = (localStorage.getItem("kanbanAlarm") ||
      "alarm1") as AlarmType;

    // Reset running timers when loading but keep task data
    const resetTasks = savedTasks.map((task) => ({
      ...task,
      isRunning: false,
      timeLeft: 0,
      alarmPlayed: false,
      startTime: undefined,
    }));

    if (resetTasks.length > 0) {
      setTasks(resetTasks);
    }
    setSelectedAlarm(savedAlarm);
  }, []);

  // Save tasks to localStorage whenever they change
  useEffect(() => {
    if (tasks.length >= 0) {
      localStorage.setItem("kanbanTasks", JSON.stringify(tasks));
    }
  }, [tasks]);

  // Save alarm preference
  useEffect(() => {
    localStorage.setItem("kanbanAlarm", selectedAlarm);
  }, [selectedAlarm]);

  const alarmSounds: Record<AlarmType, AlarmSound> = {
    alarm1: {
      name: "Classic Bell",
      url: "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3",
    },
    alarm2: {
      name: "Digital Alarm",
      url: "https://assets.mixkit.co/active_storage/sfx/2858/2858-preview.mp3",
    },
    alarm3: {
      name: "Morning Clock",
      url: "https://assets.mixkit.co/active_storage/sfx/2863/2863-preview.mp3",
    },
    alarm4: {
      name: "Alert Tone",
      url: "https://assets.mixkit.co/active_storage/sfx/2870/2870-preview.mp3",
    },
    alarm5: {
      name: "Notification",
      url: "https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3",
    },
    alarm6: {
      name: "Ping Alert",
      url: "https://assets.mixkit.co/active_storage/sfx/2357/2357-preview.mp3",
    },
    alarm7: {
      name: "Chime",
      url: "https://assets.mixkit.co/active_storage/sfx/2359/2359-preview.mp3",
    },
    alarm8: {
      name: "Success Bell",
      url: "https://assets.mixkit.co/active_storage/sfx/2000/2000-preview.mp3",
    },
    alarm9: {
      name: "Beep Alert",
      url: "https://assets.mixkit.co/active_storage/sfx/2571/2571-preview.mp3",
    },
    alarm10: {
      name: "Ring Tone",
      url: "https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3",
    },
  };

  const playAlarm = (): void => {
    const audio = new Audio(alarmSounds[selectedAlarm].url);
    audio.volume = 0.7;

    // Play immediately
    audio.play().catch((err) => console.error("Audio play error:", err));

    // Set up interval to play every 10 seconds for 1 minute (6 times total)
    let playCount = 1;
    const interval = setInterval(() => {
      if (playCount < 3) {
        const newAudio = new Audio(alarmSounds[selectedAlarm].url);
        newAudio.volume = 0.2;
        newAudio.play().catch((err) => console.error("Audio play error:", err));
        playCount++;
      } else {
        clearInterval(interval);
        setAlarmInterval(null);
      }
    }, 1000);

    setAlarmInterval(interval);
  };

  const stopAlarm = (taskId: number): void => {
    // Clear the alarm interval
    if (alarmInterval) {
      clearInterval(alarmInterval);
      setAlarmInterval(null);
    }

    // Update task to stop showing the stop button
    setTasks(
      tasks.map((task) =>
        task.id === taskId ? { ...task, alarmPlayed: false } : task
      )
    );
  };

  const previewAlarm = (alarmType: AlarmType): void => {
    const audio = new Audio(alarmSounds[alarmType].url);
    audio.volume = 0.7;
    audio.play().catch((err) => console.error("Audio play error:", err));
  };

  const addTask = (): void => {
    if (newTaskText.trim()) {
      setTasks([
        ...tasks,
        {
          id: Date.now(),
          text: newTaskText,
          minutes: 0,
          seconds: 0,
          timeLeft: 0,
          isRunning: false,
          originalTime: 0,
          alarmPlayed: false,
        },
      ]);
      setNewTaskText("");
    }
  };

  const deleteTask = (id: number): void => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  const startEditing = (task: Task): void => {
    setEditingTaskId(task.id);
    setEditText(task.text);
  };

  const saveEdit = (id: number): void => {
    if (editText.trim()) {
      setTasks(
        tasks.map((task) =>
          task.id === id ? { ...task, text: editText } : task
        )
      );
    }
    setEditingTaskId(null);
    setEditText("");
  };

  const cancelEdit = (): void => {
    setEditingTaskId(null);
    setEditText("");
  };

  const updateTaskTime = (
    id: number,
    field: "minutes" | "seconds",
    value: string
  ): void => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          const newTask = {
            ...task,
            [field]: Math.max(0, parseInt(value) || 0),
          };
          return newTask;
        }
        return task;
      })
    );
  };

  const toggleTimer = (id: number): void => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          if (!task.isRunning) {
            const totalSeconds = task.minutes * 60 + task.seconds;
            const startTime = Date.now();
            return {
              ...task,
              isRunning: true,
              timeLeft: totalSeconds,
              originalTime: totalSeconds,
              alarmPlayed: false,
              startTime: startTime,
            };
          } else {
            return { ...task, isRunning: false, startTime: undefined };
          }
        }
        return task;
      })
    );
  };

  const resetTimer = (id: number): void => {
    setTasks(
      tasks.map((task) => {
        if (task.id === id) {
          return {
            ...task,
            isRunning: false,
            timeLeft: 0,
            originalTime: 0,
            alarmPlayed: false,
            startTime: undefined,
          };
        }
        return task;
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setTasks((prevTasks) =>
        prevTasks.map((task) => {
          if (task.isRunning && task.startTime) {
            // Calculate elapsed time based on actual clock time
            const elapsed = Math.floor((Date.now() - task.startTime) / 1000);
            const newTimeLeft = Math.max(0, task.originalTime - elapsed);

            if (newTimeLeft > 0) {
              return { ...task, timeLeft: newTimeLeft };
            } else if (!task.alarmPlayed) {
              playAlarm();
              return {
                ...task,
                timeLeft: 0,
                isRunning: false,
                alarmPlayed: true,
              };
            }
          }
          return task;
        })
      );
    }, 100); // Check more frequently (every 100ms) for better accuracy

    return () => clearInterval(interval);
  }, [selectedAlarm]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Kanban Timer</h1>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-3 bg-white rounded-lg shadow-md hover:shadow-lg transition-all"
          >
            <Settings size={24} className="text-gray-700" />
          </button>
        </div>

        {showSettings && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Alarm Sound
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {(Object.entries(alarmSounds) as [AlarmType, AlarmSound][]).map(
                ([key, alarm]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedAlarm(key);
                      previewAlarm(key);
                    }}
                    className={`px-4 py-3 rounded-lg font-medium transition-all text-sm ${
                      selectedAlarm === key
                        ? "bg-blue-500 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {alarm.name}
                  </button>
                )
              )}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && addTask()}
              placeholder="Enter a new task..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={addTask}
              className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
            >
              Add Task
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                {editingTaskId === task.id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && saveEdit(task.id)}
                      className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      autoFocus
                    />
                    <button
                      onClick={() => saveEdit(task.id)}
                      className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      <Check size={18} />
                    </button>
                    <button
                      onClick={cancelEdit}
                      className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                ) : (
                  <>
                    <h3 className="text-xl font-semibold text-gray-800 flex-1">
                      {task.text}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(task)}
                        className="text-gray-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => deleteTask(task.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <X size={20} />
                      </button>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={task.minutes}
                    onChange={(e) =>
                      updateTaskTime(task.id, "minutes", e.target.value)
                    }
                    disabled={task.isRunning}
                    placeholder="Min"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    min="0"
                  />
                  <span className="text-gray-600 font-medium">min</span>

                  <input
                    type="number"
                    value={task.seconds}
                    onChange={(e) =>
                      updateTaskTime(task.id, "seconds", e.target.value)
                    }
                    disabled={task.isRunning}
                    placeholder="Sec"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                    min="0"
                    max="59"
                  />
                  <span className="text-gray-600 font-medium">sec</span>
                </div>

                {task.isRunning && (
                  <div className="text-2xl font-bold text-blue-600 ml-4">
                    {formatTime(task.timeLeft)}
                  </div>
                )}

                {task.timeLeft === 0 &&
                  task.originalTime > 0 &&
                  !task.isRunning && (
                    <div className="flex items-center gap-3 ml-4">
                      <div className="text-lg font-semibold text-green-600 animate-pulse">
                        ✓ Completed!
                      </div>
                      {task.alarmPlayed && (
                        <button
                          onClick={() => stopAlarm(task.id)}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium text-sm"
                        >
                          Stop Alarm
                        </button>
                      )}
                    </div>
                  )}

                <div className="flex gap-2 ml-auto">
                  <button
                    onClick={() => toggleTimer(task.id)}
                    className={`p-3 rounded-lg transition-colors ${
                      task.isRunning
                        ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                        : "bg-green-500 hover:bg-green-600 text-white"
                    }`}
                  >
                    {task.isRunning ? <Pause size={20} /> : <Play size={20} />}
                  </button>

                  {(task.isRunning || task.originalTime > 0) && (
                    <button
                      onClick={() => resetTimer(task.id)}
                      className="p-3 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
                    >
                      <RotateCcw size={20} />
                    </button>
                  )}
                </div>
              </div>

              {task.originalTime > 0 && (
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                      style={{
                        width: `${
                          ((task.originalTime - task.timeLeft) /
                            task.originalTime) *
                          100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg">No tasks yet. Add your first task above!</p>
          </div>
        )}
      </div>
    </div>
  );
}

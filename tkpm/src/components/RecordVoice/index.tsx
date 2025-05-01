import { useState, useRef, useEffect } from "react"
import { Button as MuiButton, Card as MuiCard, CardContent as MuiCardContent } from '@mui/material';
import { Mic, Square, Play, Trash2, Download, Check } from "lucide-react"

type Recording = {
  id: string
  url: string
  blob: Blob
  createdAt: Date
  duration: number
}

interface VoiceRecorderProps {
  onRecordingComplete?: (url: string, blob: Blob) => void; // Callback để trả lại URL và blob của bản ghi
  singleRecordingMode?: boolean; // Chế độ chỉ ghi một lần và trả về kết quả
}

export function VoiceRecorder({ onRecordingComplete, singleRecordingMode = false }: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [currentlyPlaying, setCurrentlyPlaying] = useState<string | null>(null)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isBlinking, setIsBlinking] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Cleanup function to stop recording and clear timer when component unmounts
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop()
      }
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
      recordings.forEach((recording) => {
        URL.revokeObjectURL(recording.url)
      })
    }
  }, [isRecording, recordings])

  // Tạo hiệu ứng nhấp nháy khi đang ghi âm
  useEffect(() => {
    let blinkInterval: NodeJS.Timeout | null = null

    if (isRecording) {
      blinkInterval = setInterval(() => {
        setIsBlinking((prev) => !prev)
      }, 500)
    } else {
      setIsBlinking(false)
    }

    return () => {
      if (blinkInterval) {
        clearInterval(blinkInterval)
      }
    }
  }, [isRecording])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      // Reset recording time before starting
      setRecordingTime(0)

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" })
        const audioUrl = URL.createObjectURL(audioBlob)

        // Store the current recording time as the duration
        const duration = recordingTime

        const newRecording: Recording = {
          id: Date.now().toString(),
          url: audioUrl,
          blob: audioBlob,
          createdAt: new Date(),
          duration: duration,
        }

        // Nếu trong chế độ ghi âm đơn, gọi callback và không lưu vào danh sách recordings
        if (singleRecordingMode && onRecordingComplete) {
          onRecordingComplete(audioUrl, audioBlob);
        } else {
          setRecordings((prev) => [newRecording, ...prev])
        }

        // Reset recording time after stopping
        if (timerRef.current) {
          clearInterval(timerRef.current)
          timerRef.current = null
        }

        // Stop all tracks from the stream to release the microphone
        stream.getTracks().forEach((track) => track.stop())
      }

      // Start recording
      mediaRecorder.start()
      setIsRecording(true)

      // Start timer with a more reliable interval
      timerRef.current = setInterval(() => {
        setRecordingTime((prevTime) => prevTime + 1)
      }, 1000)
    } catch (error) {
      console.error("Không thể truy cập microphone:", error)
      alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      // We'll keep the timer value until the onstop handler processes it
      // but stop the timer from incrementing
      if (timerRef.current) {
        clearInterval(timerRef.current)
        timerRef.current = null
      }
    }
  }

  const playRecording = (recordingId: string, url: string) => {
    // Stop current audio if playing
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }

    if (currentlyPlaying === recordingId) {
      setCurrentlyPlaying(null)
      return
    }

    const audio = new Audio(url)
    audioRef.current = audio

    audio.onended = () => {
      setCurrentlyPlaying(null)
    }

    audio.play()
    setCurrentlyPlaying(recordingId)
  }

  const deleteRecording = (recordingId: string) => {
    setRecordings((prev) => {
      const updatedRecordings = prev.filter((rec) => rec.id !== recordingId)
      return updatedRecordings
    })

    if (currentlyPlaying === recordingId && audioRef.current) {
      audioRef.current.pause()
      setCurrentlyPlaying(null)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const downloadRecording = (recording: Recording) => {
    // Create a temporary anchor element
    const downloadLink = document.createElement("a")
    downloadLink.href = recording.url

    // Format date for filename
    const date = new Date(recording.createdAt)
    const formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}_${String(date.getHours()).padStart(2, "0")}-${String(date.getMinutes()).padStart(2, "0")}-${String(date.getSeconds()).padStart(2, "0")}`

    // Set filename with date
    downloadLink.download = `ghi-am_${formattedDate}.wav`

    // Append to body, click and remove
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)
  }

  // Hàm để sử dụng bản ghi âm hiện tại (dùng trong chế độ single recording)
  const useRecording = (recording: Recording) => {
    if (onRecordingComplete) {
      onRecordingComplete(recording.url, recording.blob);
    }
  }

  return (
    <div className="space-y-6">
      <MuiCard>
        <MuiCardContent>
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className={`text-4xl font-bold ${isRecording && isBlinking ? "text-red-500" : ""}`}>
              {formatTime(recordingTime)}
            </div>

            <div className="flex items-center justify-center space-x-4">
              {!isRecording ? (
                <MuiButton
                  onClick={startRecording}
                  variant="contained"
                  color="error"
                >
                  <Mic className="h-8 w-8" />
                  <span className="sr-only">Bắt đầu ghi âm</span>
                </MuiButton>
              ) : (
                <MuiButton
                  onClick={stopRecording}
                  variant="contained"
                  color="error"
                >
                  <Square className="h-6 w-6" />
                  <span className="sr-only">Dừng ghi âm</span>
                </MuiButton>
              )}
            </div>

            <div className="text-sm text-muted-foreground">
              {isRecording ? "Đang ghi âm..." : "Nhấn nút để bắt đầu ghi âm"}
            </div>
          </div>
        </MuiCardContent>
      </MuiCard>

      {/* Hiển thị danh sách bản ghi âm, tùy thuộc vào chế độ */}
      {singleRecordingMode ? (
        // Trong chế độ ghi âm đơn, chỉ hiển thị bản ghi âm mới nhất
        recordings.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-xl font-bold">Bản ghi mới nhất</h2>
            <MuiCard>
              <MuiCardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="font-medium">Bản ghi {new Date(recordings[0].createdAt).toLocaleTimeString()}</div>
                  <div className="text-sm text-muted-foreground">{formatTime(recordings[0].duration)}</div>
                </div>

                <div className="flex space-x-2">
                  <MuiButton 
                    variant="outlined" 
                    size="small" 
                    onClick={() => playRecording(recordings[0].id, recordings[0].url)}
                  >
                    <Play className={`h-4 w-4 ${currentlyPlaying === recordings[0].id ? "text-green-500" : ""}`} />
                    <span className="sr-only">Phát</span>
                  </MuiButton>

                  <MuiButton 
                    variant="outlined" 
                    size="small" 
                    onClick={() => useRecording(recordings[0])}
                    color="success"
                  >
                    <Check className="h-4 w-4" />
                    <span className="sr-only">Sử dụng</span>
                  </MuiButton>

                  <MuiButton 
                    variant="outlined" 
                    size="small" 
                    onClick={() => deleteRecording(recordings[0].id)}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Xóa</span>
                  </MuiButton>
                </div>
              </MuiCardContent>
              <div style={{ padding: "0 16px 16px 16px" }}>
                <audio controls src={recordings[0].url} className="w-100">
                  Trình duyệt của bạn không hỗ trợ phát audio.
                </audio>
              </div>
            </MuiCard>
          </div>
        )
      ) : (
        // Trong chế độ ghi âm bình thường, hiển thị tất cả bản ghi
        <div className="space-y-2">
          <h2 className="text-xl font-bold">Bản ghi ({recordings.length})</h2>

          {recordings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center text-muted-foreground">
              Chưa có bản ghi nào
            </div>
          ) : (
            <div className="space-y-2">
              {recordings.map((recording) => (
                <MuiCard key={recording.id}>
                  <MuiCardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium">Bản ghi {new Date(recording.createdAt).toLocaleTimeString()}</div>
                      <div className="text-sm text-muted-foreground">{formatTime(recording.duration)}</div>
                    </div>

                    <div className="flex space-x-2">
                      <MuiButton 
                        variant="outlined" 
                        size="small" 
                        onClick={() => playRecording(recording.id, recording.url)}
                      >
                        <Play className={`h-4 w-4 ${currentlyPlaying === recording.id ? "text-green-500" : ""}`} />
                        <span className="sr-only">Phát</span>
                      </MuiButton>

                      <MuiButton 
                        variant="outlined" 
                        size="small" 
                        onClick={() => downloadRecording(recording)}
                      >
                        <Download className="h-4 w-4" />
                        <span className="sr-only">Tải xuống</span>
                      </MuiButton>

                      {onRecordingComplete && (
                        <MuiButton 
                          variant="outlined" 
                          size="small" 
                          onClick={() => useRecording(recording)}
                          color="success"
                        >
                          <Check className="h-4 w-4" />
                          <span className="sr-only">Sử dụng</span>
                        </MuiButton>
                      )}

                      <MuiButton 
                        variant="outlined" 
                        size="small" 
                        onClick={() => deleteRecording(recording.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Xóa</span>
                      </MuiButton>
                    </div>
                  </MuiCardContent>
                  <div style={{ padding: "0 16px 16px 16px" }}>
                    <audio controls src={recording.url} className="w-100">
                      Trình duyệt của bạn không hỗ trợ phát audio.
                    </audio>
                  </div>
                </MuiCard>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
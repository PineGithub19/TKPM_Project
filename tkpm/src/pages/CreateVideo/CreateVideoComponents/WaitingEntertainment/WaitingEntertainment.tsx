import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import styles from "./WaitingEntertainment.module.css";

const entries = [
  { quote: "“Viết văn là hành trình tự hiểu mình.”", emoji: "🧠", author: "ChatGPT 1990 Bản Cũ", theme: "./quote0.jpeg" },
  { quote: "“Ngồi chờ AI mà không chill là dở.”", emoji: "☕", author: "Gemini Bản Ổn Định", theme: "./quote1.jpeg" },
  { quote: "“Đời như văn học, chỉ khác là ít happy ending.”", emoji: "📖", author: "Siri 5.1 Tích Hợp", theme: "./quote2.jpeg" },
  { quote: "“Đợi chút nha, video đang được nấu bằng deep learning.”", emoji: "🍳", author: "GPT-4 Plus Pro Max", theme: "./quote3.jpeg" },
  { quote: "“Đọc văn học giúp ta thông minh hơn.”", emoji: "📚", author: "Bing AI Thần Thánh", theme: "./quote4.jpeg" },
  { quote: "“AI đang suy nghĩ thay bạn... nhưng crush bạn lại nghĩ về người khác.”", emoji: "🤖💔", author: "DeepMind Ultra Gen 7", theme: "./quote5.jpeg" },
  { quote: "“Lên level AI là đi lên tầng thượng.”", emoji: "🕹️", author: "Claude Pro Max Bản Đặc Biệt", theme: "./quote6.jpeg" },
  { quote: "“Không có gì khó, chỉ có điều không dễ”", emoji: "💡", author: "Cortana 2.0 Phiên Bản Ráp Lại", theme: "./quote7.jpeg" },
  { quote: "“Muốn giỏi, phải tìm đến AI?”", emoji: "💻", author: "Bing AI Kỹ Thuật Cao Cấp", theme: "./quote8.jpeg" },
  { quote: "“Thời đại này không AI không thể sống nổi.”", emoji: "⚡", author: "Assistant 9999 Ultra", theme: "./quote9.jpeg" }
];

function formatTime(seconds: number) {
  const m = String(Math.floor(seconds / 60)).padStart(2, "0");
  const s = String(seconds % 60).padStart(2, "0");
  return `${m}:${s}`;
}

export default function WaitingEntertainment() {
  const [time, setTime] = useState(0);
  const [entry, setEntry] = useState(entries[0]);

  useEffect(() => {
    const timer = setInterval(() => setTime(t => t + 1), 1000);
    const quoteTimer = setInterval(() => {
      const random = entries[Math.floor(Math.random() * entries.length)];
      setEntry(random);
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(quoteTimer);
    };
  }, []);

  const backgroundImage = `url(${entry.theme})`;

  return (
    <motion.div 
      className={styles.container}
      style={{ backgroundImage }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.div
        className={styles.emoji}
        key={entry.emoji}
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {entry.emoji}
      </motion.div>
      <p className={styles.quote}>{entry.quote}</p>
      <p className={styles.time}>⏳ Đã chờ: {formatTime(time)}</p>
      <div className={styles.author}>- {entry.author} -</div>
    </motion.div>
  );
}

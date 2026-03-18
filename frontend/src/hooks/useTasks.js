import { useState, useEffect } from "react";
import api from "../api/axios";

export function useTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    const { data } = await api.get("/tasks");
    setTasks(data);
    setLoading(false);
  };

  useEffect(() => { fetchTasks(); }, []);

  return { tasks, loading, refetch: fetchTasks };
}

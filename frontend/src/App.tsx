import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react'
import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type Task,
} from './api/tasks'
import './App.css'

function App() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [newTitle, setNewTitle] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const fetchTasks = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await listTasks()
      setTasks(response)
    } catch {
      setError('Nao foi possivel carregar as tarefas.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void fetchTasks()
  }, [fetchTasks])

  useEffect(() => {
    if (!feedback) {
      return
    }

    const timeout = window.setTimeout(() => {
      setFeedback(null)
    }, 2000)

    return () => window.clearTimeout(timeout)
  }, [feedback])

  const hasTasks = tasks.length > 0
  const isBusy = useMemo(() => busyId !== null, [busyId])

  const onCreateTask = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const title = newTitle.trim()
    if (!title) {
      return
    }

    setBusyId('create')
    setError(null)
    try {
      const created = await createTask({ title })
      setTasks((current) => [created, ...current])
      setNewTitle('')
      setFeedback('Tarefa criada com sucesso.')
    } catch {
      setError('Nao foi possivel criar a tarefa.')
    } finally {
      setBusyId(null)
    }
  }

  const onToggleTask = async (task: Task) => {
    setBusyId(task.id)
    setError(null)
    try {
      const updated = await updateTask(task.id, { is_completed: !task.is_completed })
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setFeedback(updated.is_completed ? 'Tarefa concluida.' : 'Tarefa reaberta.')
    } catch {
      setError('Nao foi possivel atualizar a tarefa.')
    } finally {
      setBusyId(null)
    }
  }

  const onDeleteTask = async (taskId: string) => {
    setBusyId(taskId)
    setError(null)
    try {
      await deleteTask(taskId)
      setTasks((current) => current.filter((item) => item.id !== taskId))
      setFeedback('Tarefa excluida.')
    } catch {
      setError('Nao foi possivel excluir a tarefa.')
    } finally {
      setBusyId(null)
    }
  }

  const onStartEdit = (task: Task) => {
    setEditingId(task.id)
    setEditTitle(task.title)
  }

  const onSaveEdit = async (taskId: string) => {
    const title = editTitle.trim()
    if (!title) {
      return
    }

    setBusyId(taskId)
    setError(null)
    try {
      const updated = await updateTask(taskId, { title })
      setTasks((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      )
      setEditingId(null)
      setEditTitle('')
      setFeedback('Titulo atualizado.')
    } catch {
      setError('Nao foi possivel editar o titulo.')
    } finally {
      setBusyId(null)
    }
  }

  return (
    <main className="app-shell">
      <section className="card">
        <header className="header">
          <h1>Tarefas</h1>
          <p>appGetUp - MVP de gestao de tarefas</p>
        </header>

        <form onSubmit={onCreateTask} className="create-form">
          <label htmlFor="new-task-title">Nova tarefa</label>
          <div className="row">
            <input
              id="new-task-title"
              type="text"
              value={newTitle}
              onChange={(event) => setNewTitle(event.target.value)}
              placeholder="Digite o titulo da tarefa"
              maxLength={120}
            />
            <button type="submit" disabled={isBusy || !newTitle.trim()}>
              Criar
            </button>
          </div>
        </form>

        {feedback ? (
          <p className="feedback" role="status">
            {feedback}
          </p>
        ) : null}

        {loading ? <p className="info">Carregando tarefas...</p> : null}

        {!loading && error ? (
          <div className="error-box" role="alert">
            <p>{error}</p>
            <button type="button" onClick={() => void fetchTasks()}>
              Tentar novamente
            </button>
          </div>
        ) : null}

        {!loading && !error && !hasTasks ? (
          <p className="info">Nenhuma tarefa cadastrada.</p>
        ) : null}

        {!loading && !error && hasTasks ? (
          <ul className="task-list">
            {tasks.map((task) => {
              const itemBusy = busyId === task.id
              const isEditing = editingId === task.id
              return (
                <li key={task.id} className="task-item">
                  <div className="task-content">
                    {isEditing ? (
                      <input
                        aria-label="Editar titulo"
                        type="text"
                        value={editTitle}
                        onChange={(event) => setEditTitle(event.target.value)}
                        maxLength={120}
                      />
                    ) : (
                      <p className={task.is_completed ? 'done' : ''}>{task.title}</p>
                    )}
                  </div>

                  <div className="actions">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => void onSaveEdit(task.id)}
                          disabled={itemBusy || !editTitle.trim()}
                        >
                          Salvar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(null)
                            setEditTitle('')
                          }}
                          disabled={itemBusy}
                        >
                          Cancelar
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => void onToggleTask(task)}
                          disabled={itemBusy}
                        >
                          {task.is_completed ? 'Reabrir' : 'Concluir'}
                        </button>
                        <button
                          type="button"
                          onClick={() => onStartEdit(task)}
                          disabled={itemBusy}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => void onDeleteTask(task.id)}
                          disabled={itemBusy}
                          className="danger"
                        >
                          Excluir
                        </button>
                      </>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
        ) : null}
      </section>
    </main>
  )
}

export default App

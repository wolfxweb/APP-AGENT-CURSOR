import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { vi } from 'vitest'
import App from './App'
import * as tasksApi from './api/tasks'

vi.mock('./api/tasks')

const mockedApi = vi.mocked(tasksApi)
const baseTask = {
  id: 'task-1',
  title: 'Tarefa inicial',
  is_completed: false,
  created_at: '2026-03-30T00:00:00Z',
  updated_at: '2026-03-30T00:00:00Z',
}

describe('App', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    mockedApi.listTasks.mockResolvedValue([])
  })

  it('mostra estado vazio apos carregamento', async () => {
    render(<App />)

    expect(screen.getByText('Carregando tarefas...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Nenhuma tarefa cadastrada.')).toBeInTheDocument()
    })
  })

  it('mostra erro inicial e botao de tentar novamente', async () => {
    mockedApi.listTasks.mockRejectedValueOnce(new Error('falha'))

    render(<App />)

    await waitFor(() => {
      expect(
        screen.getByText('Nao foi possivel carregar as tarefas.'),
      ).toBeInTheDocument()
    })

    expect(
      screen.getByRole('button', { name: 'Tentar novamente' }),
    ).toBeInTheDocument()
  })

  it('cria tarefa com sucesso', async () => {
    mockedApi.createTask.mockResolvedValueOnce({
      ...baseTask,
      id: 'task-2',
      title: 'Nova tarefa',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Nenhuma tarefa cadastrada.')).toBeInTheDocument()
    })

    fireEvent.change(screen.getByLabelText('Nova tarefa'), {
      target: { value: 'Nova tarefa' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Criar' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument()
      expect(screen.getByText('Tarefa criada com sucesso.')).toBeInTheDocument()
    })
  })

  it('conclui e reabre tarefa', async () => {
    mockedApi.listTasks.mockResolvedValueOnce([baseTask])
    mockedApi.updateTask.mockResolvedValueOnce({
      ...baseTask,
      is_completed: true,
      updated_at: '2026-03-30T00:01:00Z',
    })
    mockedApi.updateTask.mockResolvedValueOnce({
      ...baseTask,
      is_completed: false,
      updated_at: '2026-03-30T00:02:00Z',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tarefa inicial')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Concluir' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Reabrir' })).toBeInTheDocument()
      expect(screen.getByText('Tarefa concluida.')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Reabrir' }))
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Concluir' })).toBeInTheDocument()
      expect(screen.getByText('Tarefa reaberta.')).toBeInTheDocument()
    })
  })

  it('edita titulo de tarefa', async () => {
    mockedApi.listTasks.mockResolvedValueOnce([baseTask])
    mockedApi.updateTask.mockResolvedValueOnce({
      ...baseTask,
      title: 'Titulo alterado',
      updated_at: '2026-03-30T00:01:00Z',
    })

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tarefa inicial')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Editar' }))
    fireEvent.change(screen.getByLabelText('Editar titulo'), {
      target: { value: 'Titulo alterado' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => {
      expect(screen.getByText('Titulo alterado')).toBeInTheDocument()
      expect(screen.getByText('Titulo atualizado.')).toBeInTheDocument()
    })
  })

  it('exclui tarefa', async () => {
    mockedApi.listTasks.mockResolvedValueOnce([baseTask])
    mockedApi.deleteTask.mockResolvedValueOnce()

    render(<App />)

    await waitFor(() => {
      expect(screen.getByText('Tarefa inicial')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Excluir' }))

    await waitFor(() => {
      expect(screen.queryByText('Tarefa inicial')).not.toBeInTheDocument()
      expect(screen.getByText('Tarefa excluida.')).toBeInTheDocument()
    })
  })
})

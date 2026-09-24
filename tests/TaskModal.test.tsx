import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskModal } from '../src/features/tasks/TaskModal';
import { getTodayDateString } from '../src/utils';
import { Task } from '../src/types';

describe('TaskModal', () => {
  it('no muestra el formulario cuando isOpen es false', () => {
    render(<TaskModal isOpen={false} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.queryByLabelText(/título de la tarea/i)).not.toBeInTheDocument();
  });

  it('muestra "Nueva Tarea" cuando no hay initialTask', () => {
    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByText('Nueva Tarea')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /crear tarea/i })).toBeInTheDocument();
  });

  it('muestra "Editar Tarea" y precarga los datos cuando hay initialTask', () => {
    const initialTask: Task = {
      id: 'task-1',
      title: 'Tarea existente',
      description: 'Descripción existente',
      status: 'pendiente',
      priority: 'alta',
      category: 'estudio',
      dueDate: '2026-07-01',
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} initialTask={initialTask} />);

    expect(screen.getByText('Editar Tarea')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Tarea existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Descripción existente')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /guardar cambios/i })).toBeInTheDocument();
  });

  it('el botón de guardar está deshabilitado si el título está vacío', () => {
    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);
    expect(screen.getByRole('button', { name: /crear tarea/i })).toBeDisabled();
  });

  it('habilita el botón de guardar al escribir un título', async () => {
    const user = userEvent.setup();
    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), 'Mi nueva tarea');

    expect(screen.getByRole('button', { name: /crear tarea/i })).toBeEnabled();
  });

  it('llama a onSave con los valores por defecto al crear una tarea simple', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), 'Comprar pan');
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(onSave).toHaveBeenCalledWith({
      title: 'Comprar pan',
      description: undefined,
      priority: 'media',
      category: 'trabajo',
      dueDate: getTodayDateString(),
      subtasks: [],
    });
  });

  it('llama a onClose después de guardar', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(<TaskModal isOpen={true} onClose={onClose} onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), 'Tarea cualquiera');
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(onClose).toHaveBeenCalled();
  });

  it('llama a onClose al presionar Cancelar, sin llamar a onSave', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    const onClose = vi.fn();

    render(<TaskModal isOpen={true} onClose={onClose} onSave={onSave} />);

    await user.click(screen.getByRole('button', { name: /cancelar/i }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('permite seleccionar una prioridad distinta antes de guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), 'Tarea urgente');
    await user.click(screen.getByRole('button', { name: /^alta$/i }));
    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'alta' })
    );
  });

  it('agrega una subtarea con el botón "+" y la incluye al guardar', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();

    const { container } = render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={onSave} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), 'Tarea con pasos');
    await user.type(screen.getByPlaceholderText(/añadir paso o subtarea/i), 'Primer paso');

    // El botón "+" no tiene texto accesible (solo un ícono SVG), así que
    // se localiza por su clase CSS en vez de por rol/texto.
    const addSubtaskButton = container.querySelector('.task-add-subtask-btn');
    expect(addSubtaskButton).not.toBeNull();
    await user.click(addSubtaskButton as HTMLElement);

    // La subtarea debería listarse en pantalla
    expect(screen.getByText('• Primer paso')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /crear tarea/i }));

    expect(onSave).toHaveBeenCalledWith(
      expect.objectContaining({
        subtasks: [{ title: 'Primer paso', completed: false }],
      })
    );
  });

  it('agrega una subtarea al presionar Enter en el campo de subtarea', async () => {
    const user = userEvent.setup();

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    const subtaskInput = screen.getByPlaceholderText(/añadir paso o subtarea/i);
    await user.type(subtaskInput, 'Paso por Enter{Enter}');

    expect(screen.getByText('• Paso por Enter')).toBeInTheDocument();
    // El campo debe limpiarse después de agregar
    expect(subtaskInput).toHaveValue('');
  });

  it('elimina una subtarea al presionar su botón de borrar', async () => {
    const user = userEvent.setup();

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    const subtaskInput = screen.getByPlaceholderText(/añadir paso o subtarea/i);
    await user.type(subtaskInput, 'Paso a borrar{Enter}');
    expect(screen.getByText('• Paso a borrar')).toBeInTheDocument();

    // El botón de borrar está dentro de la misma fila que el texto de la subtarea
    const row = screen.getByText('• Paso a borrar').closest('div');
    const deleteButton = row?.querySelector('button');
    if (deleteButton) await user.click(deleteButton);

    expect(screen.queryByText('• Paso a borrar')).not.toBeInTheDocument();
  });

  it('no permite guardar con un título que solo tiene espacios', async () => {
    const user = userEvent.setup();

    render(<TaskModal isOpen={true} onClose={vi.fn()} onSave={vi.fn()} />);

    await user.type(screen.getByLabelText(/título de la tarea/i), '   ');

    expect(screen.getByRole('button', { name: /crear tarea/i })).toBeDisabled();
  });
});
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { downloadFile } from '../../adapters/file/download';

vi.mock('../../adapters/file/download', () => ({
  downloadFile: vi.fn()
}));

describe('flujo completo del asistente', () => {
  const promptValues = [
    'Proyecto Test',
    '2024-05-01',
    '2024-05-02',
    'Ubicación Centro',
    '',
    '',
    'Staff Uno',
    '',
    ''
  ];
  let promptCalls = 0;

  beforeEach(() => {
    promptCalls = 0;
    vi.spyOn(window, 'prompt').mockImplementation(() => promptValues[promptCalls++] ?? '');
    vi.spyOn(window, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('permite crear, editar y exportar un proyecto local', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByText('Nuevo', { selector: 'button' }));

    expect(await screen.findByText('Información general')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Cliente' }));

    await user.click(screen.getAllByText('+15 min')[0]);

    await user.click(screen.getByRole('button', { name: 'Crear ubicación' }));
    const option = await screen.findByRole('option', { name: 'Ubicación Centro' });
    await user.selectOptions(screen.getByLabelText('Ubicación'), option);

    await user.click(screen.getByRole('button', { name: 'Staff' }));
    await user.click(screen.getByText('Añadir miembro'));

    const schedule = await screen.findByLabelText('Horario de Staff Uno');
    await user.click(within(schedule).getAllByText('+15 min')[0]);

    await user.click(screen.getByRole('button', { name: 'Resultados' }));
    expect(screen.getByText('Horarios')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Guardar como…' }));
    expect(downloadFile).toHaveBeenCalled();
  });
});

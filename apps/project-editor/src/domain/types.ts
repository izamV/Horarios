import { z } from 'zod';

export const schemaVersion = 1;

export const MaterialQtySchema = z.object({
  materialId: z.string().min(1),
  cantidad: z.number().min(0)
});

export const MaterialTypeSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  unidad: z.string().min(1)
});

export const LocationSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional()
});

export const PersonSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  rol: z.enum(['CLIENTE', 'STAFF'])
});

export const TaskTypeSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  requiereSubtareas: z.boolean().optional(),
  defaultMaterials: z.array(MaterialQtySchema).optional()
});

export const SessionSchema = z.object({
  id: z.string().min(1),
  ownerId: z.string().min(1),
  ownerRol: z.enum(['CLIENTE', 'STAFF']),
  inicioISO: z.string().min(1),
  finISO: z.string().min(1),
  locationId: z.string().optional(),
  tareaId: z.string().optional(),
  materiales: z.array(MaterialQtySchema).optional(),
  infoExtra: z.string().optional()
});

export const ProjectSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  notas: z.string().optional(),
  fechas: z.object({
    inicio: z.string().min(1),
    fin: z.string().min(1)
  }),
  ubicaciones: z.array(LocationSchema),
  cliente: PersonSchema.optional(),
  staff: z.array(PersonSchema),
  tareas: z.array(TaskTypeSchema),
  sesiones: z.array(SessionSchema),
  materiales: z.array(MaterialTypeSchema),
  creadoAt: z.string().min(1),
  actualizadoAt: z.string().min(1),
  schemaVersion: z.literal(schemaVersion)
});

export type MaterialQty = z.infer<typeof MaterialQtySchema>;
export type MaterialType = z.infer<typeof MaterialTypeSchema>;
export type Location = z.infer<typeof LocationSchema>;
export type Person = z.infer<typeof PersonSchema>;
export type TaskType = z.infer<typeof TaskTypeSchema>;
export type Session = z.infer<typeof SessionSchema>;
export type Project = z.infer<typeof ProjectSchema>;

export const validateProject = (input: unknown): Project => ProjectSchema.parse(input);

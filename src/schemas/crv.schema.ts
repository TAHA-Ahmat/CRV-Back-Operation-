import { z } from 'zod';

const CRVStatusEnum = z.enum(['BROUILLON', 'EN_COURS', 'TERMINE', 'VALIDE', 'VERROUILLE', 'ANNULE']);

const PhaseSchema = z.object({
  numero: z.number().int().positive('Phase numero must be positive'),
  description: z.string().min(1, 'Description required'),
  statut: z.enum(['ATTENTE', 'EN_COURS', 'TERMINE', 'NON_REALISE']),
  responsable: z.string().optional(),
  dateDebut: z.date().optional(),
  dateFin: z.date().optional(),
});

export const CreateCRVSchema = z.object({
  numero: z.string().max(10, 'Numero max 10 chars'),
  vol_id: z.string().uuid('Invalid vol ID'),
  horaire_id: z.string().uuid().optional(),
  statut: CRVStatusEnum.default('BROUILLON'),
  phases: z.array(PhaseSchema).min(1, 'At least 1 phase required'),
  completude: z.number().min(0).max(100).default(0),
  cree_par: z.string().uuid('Invalid creator ID'),
});

export const UpdateCRVSchema = z.object({
  statut: CRVStatusEnum.optional(),
  phases: z.array(PhaseSchema).optional(),
  completude: z.number().min(0).max(100).optional(),
  modifie_par: z.string().uuid(),
});

export const CRVResponseSchema = CreateCRVSchema.extend({
  _id: z.string(),
  creePar: z.object({
    _id: z.string(),
    nom: z.string(),
    email: z.string().email(),
  }),
  creeLe: z.date(),
  modifieLe: z.date(),
});

export type CreateCRVInput = z.infer<typeof CreateCRVSchema>;
export type UpdateCRVInput = z.infer<typeof UpdateCRVSchema>;
export type CRVResponse = z.infer<typeof CRVResponseSchema>;

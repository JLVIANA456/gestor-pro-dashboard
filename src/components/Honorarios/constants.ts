import { ExtraService } from './types';

export const MONTHS = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const YEARS = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

export const EXTRA_SERVICES: ExtraService[] = [
    { id: '1', name: 'Recálculo Federal', price: 50, category: 'Federal' },
    { id: '2', name: 'Recálculo Estadual', price: 50, category: 'Estadual' },
    { id: '3', name: 'Recálculo Municipal', price: 50, category: 'Municipal' },
    { id: '4', name: 'DARF Previdenciário', price: 30, category: 'Previdenciário' },
    { id: '5', name: 'GIA Sub-Calculada', price: 100, category: 'Estadual' },
    { id: '6', name: 'Parcelamento RFB', price: 150, category: 'Federal' },
];

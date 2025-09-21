export const toDateInputValue = (iso: string) => iso.slice(0, 10);

export const toTimeInputValue = (iso: string) => iso.slice(11, 16);

export const fromDateTimeInputs = (date: string, time: string) => {
  return new Date(`${date}T${time}:00`).toISOString();
};

export const minutesOptions = [5, 15, 30, 60];

const tickets = {};

export function checkTicket(clientId: string, ticket: string): boolean {
  if (!tickets[clientId]) {
    tickets[clientId] = {};
  }
  if (!tickets[clientId][ticket]) {
    console.log('storing ticket', clientId, ticket);
    tickets[clientId][ticket] = { done: false };
  }
  return tickets[clientId][ticket].done;
}

export function updateTicket(clientId: string, ticket: string, scopes: string[]): void {
  if (!tickets[clientId]) {
    throw new Error('No tickets found for this client');
  }
  if (!tickets[clientId][ticket]) {
    throw new Error('Ticket not found for this client');
  }
  tickets[clientId][ticket].scopes = scopes;
  tickets[clientId][ticket].done = true;
  console.log('ticket is done', clientId, ticket, scopes);
}
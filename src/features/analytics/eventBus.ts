type Handler<T> = (payload: T) => void

export function createEventBus<T>() {
  const handlers = new Set<Handler<T>>()
  return {
    on(h: Handler<T>) { handlers.add(h); return () => handlers.delete(h) },
    emit(payload: T) { handlers.forEach(h => h(payload)) },
  }
}



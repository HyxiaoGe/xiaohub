class SessionService {
  save(item, sessions) {
    localStorage.setItem(item, JSON.stringify(sessions))
  }

  get(item) {
    return localStorage.getItem(item)
  }

  findSessionById(sessions, id) {
    return sessions.find((session) => session.id === id)
  }

  create(sessionId) {
    const newSession = {
      id: sessionId,
      name: `新会话`,
      messages: []
    }
    return newSession
  }

  update(id, sessions) {
    const sessionIndex = sessions.findIndex((session) => session.id === id)
    if (sessionIndex === -1) {
      sessions[sessionIndex] = { ...this.sessions[sessionIndex], ...sessions }
      this.save(sessions)
    }
  }

  delete(id, sessions) {
    sessions = sessions.filter((session) => session.id !== id)
    this.save(sessions)
  }
}

const sessionService = new SessionService()
export default sessionService

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers

  const user = users.find(usr => usr.username === username)

  if (!user) {
    return response.status(400).json({ error: 'User not found' })
  }

  request.user = user

  return next()
}

function checksExistsTodo(request, response, next) {
  const { user } = request
  const { id } = request.params

  const todo = user.todos.find(td => td.id === id)

  if(!todo) {
    return response.status(404).json({ error: 'Todo not found' })
  }

  request.todo = todo

  return next()
}

app.post('/users', (request, response) => {
  const { name, username } = request.body

  const usernameAlreadyTaken = users.some(usr => usr.username === username)
  
  if (usernameAlreadyTaken) {
    return response.status(400).json({
      error: 'Username already in use'
    })
  }

  const user = {
    id: uuidv4(),
    name, 
    username, 
    todos: []
  }

  users.push(user)

  return response.status(201).json(user)
});

app.get('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request

  return response.json(user.todos)
});

app.post('/todos', checksExistsUserAccount, (request, response) => {
  const { user } = request
  const { title, deadline } = request.body

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date()
  }

  user.todos.push(todo)

  return response.status(201).json(todo)
});

app.put('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const {user} = request
  const { id } = request.params
  const { title, deadline } = request.body

  const todoIndex = user.todos.findIndex(todo => todo.id === id)

  let todo = user.todos[todoIndex]

  todo = {
    ...todo,
    title,
    deadline: new Date(deadline)
  }

  user.todos.splice(todoIndex, 1, todo)

  return response.json(todo)
});

app.patch('/todos/:id/done', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { todo } = request

  todo.done = true

  return response.json(todo)
});

app.delete('/todos/:id', checksExistsUserAccount, checksExistsTodo, (request, response) => {
  const { user } = request
  const { id } = request.params

  user.todos = user.todos.filter(td => td.id !== id)

  return response.status(204).json()
});

module.exports = app;

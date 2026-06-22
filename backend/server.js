import app from './src/main.js'

const PORT = 3001

app.listen(PORT, () => {
    console.log(`servidor ejecutando en http://localhost:${PORT}`)
})

app.get('/', (req, res) => {
    res.send("estas en el apartado principal del backend")
})
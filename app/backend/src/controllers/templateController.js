import Template from '../models/Template.js'

/* GET /api/templates */
export async function listTemplates(req, res) {
  try {
    const templates = await Template.findAll()
    res.json({ templates })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* POST /api/templates */
export async function createTemplate(req, res) {
  try {
    const { name, description, fields } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Nom requis' })
    if (!Array.isArray(fields) || fields.length === 0) return res.status(400).json({ error: 'Champs requis' })
    const { id } = await Template.create({ name: name.trim(), description, fields })
    res.status(201).json({ id })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

/* DELETE /api/templates/:id */
export async function deleteTemplate(req, res) {
  try {
    const tpl = await Template.findById(req.params.id)
    if (!tpl) return res.status(404).json({ error: 'Modèle introuvable' })
    await Template.delete(req.params.id)
    res.json({ ok: true })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Erreur serveur' })
  }
}

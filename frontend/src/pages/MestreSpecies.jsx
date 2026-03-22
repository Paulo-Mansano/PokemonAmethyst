import { useEffect, useMemo, useState } from 'react'
import {
  getHabilidades,
  getMovimentos,
  getUsuario,
  getSpeciesConfigMestre,
  listarSpeciesMestre,
  normalizarOrdemLearnsetMestre,
  resincronizarSpeciesPokeApiMestre,
  salvarSpeciesConfigMestre,
} from '../api'

const METHODS = ['LEVEL_UP', 'MACHINE', 'TUTOR', 'EGG', 'OTHER']

function moveLabel(mov) {
  const pt = (mov?.nome || '').trim()
  const en = (mov?.nomeEn || '').trim()
  if (pt && en) return `${pt} / ${en}`
  return pt || en || mov?.id || 'Movimento'
}

function abilityLabel(hab) {
  const pt = (hab?.nome || '').trim()
  const en = (hab?.nomeEn || '').trim()
  if (pt && en) return `${pt} / ${en}`
  return pt || en || hab?.id || 'Habilidade'
}

export default function MestreSpecies() {
  const [usuario, setUsuario] = useState(null)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [busca, setBusca] = useState('')
  const [speciesLista, setSpeciesLista] = useState([])
  const [speciesSelecionada, setSpeciesSelecionada] = useState(null)
  const [config, setConfig] = useState(null)
  const [habilidades, setHabilidades] = useState([])
  const [movimentos, setMovimentos] = useState([])

  const carregarSpecies = async (nome = '') => {
    const lista = await listarSpeciesMestre({ nome, limit: 120 })
    setSpeciesLista(Array.isArray(lista) ? lista : [])
  }

  useEffect(() => {
    Promise.all([
      getUsuario().then(setUsuario).catch(() => setUsuario(null)),
      getHabilidades().then(setHabilidades).catch(() => setHabilidades([])),
      getMovimentos().then(setMovimentos).catch(() => setMovimentos([])),
      carregarSpecies(''),
    ]).catch((e) => setErro(e.message || 'Erro ao carregar dados iniciais'))
  }, [])

  const carregarConfig = async (speciesId) => {
    setErro('')
    setLoadingConfig(true)
    try {
      const conf = await getSpeciesConfigMestre(speciesId)
      setConfig({
        ...conf,
        habilidades: Array.isArray(conf?.habilidades) ? conf.habilidades : [],
        learnset: Array.isArray(conf?.learnset) ? conf.learnset : [],
      })
    } catch (e) {
      setErro(e.message || 'Erro ao carregar configuração da espécie')
      setConfig(null)
    } finally {
      setLoadingConfig(false)
    }
  }

  const onBuscar = async () => {
    setErro('')
    try {
      await carregarSpecies(busca.trim())
    } catch (e) {
      setErro(e.message || 'Erro ao buscar espécies')
    }
  }

  const onSelecionarSpecies = async (sp) => {
    setSpeciesSelecionada(sp)
    await carregarConfig(sp.id)
  }

  const movimentoPorId = useMemo(() => {
    const map = new Map()
    movimentos.forEach((m) => map.set(m.id, m))
    return map
  }, [movimentos])

  const habilidadePorId = useMemo(() => {
    const map = new Map()
    habilidades.forEach((h) => map.set(h.id, h))
    return map
  }, [habilidades])

  const addHabilidade = () => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        habilidades: [...prev.habilidades, { habilidadeId: '', slot: 1, hidden: false }],
      }
    })
  }

  const addLearnset = () => {
    setConfig((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        learnset: [...prev.learnset, { movimentoId: '', learnMethod: 'LEVEL_UP', level: 1, ordem: prev.learnset.length }],
      }
    })
  }

  const salvar = async () => {
    if (!config?.speciesId) return
    setErro('')
    setSaving(true)
    try {
      const body = {
        habilidades: (config.habilidades || []).map((h) => ({
          habilidadeId: h.habilidadeId || '',
          slot: Number(h.slot || 1),
          hidden: !!h.hidden,
        })),
        learnset: (config.learnset || []).map((m, idx) => ({
          movimentoId: m.movimentoId || '',
          learnMethod: m.learnMethod || 'LEVEL_UP',
          level: m.learnMethod === 'LEVEL_UP' ? Number(m.level || 1) : null,
          ordem: m.ordem != null ? Number(m.ordem) : idx,
        })),
      }
      const salvo = await salvarSpeciesConfigMestre(config.speciesId, body)
      setConfig(salvo)
      await carregarSpecies(busca.trim())
    } catch (e) {
      setErro(e.message || 'Erro ao salvar')
    } finally {
      setSaving(false)
    }
  }

  const resincronizar = async () => {
    if (!config?.speciesId) return
    setErro('')
    setSaving(true)
    try {
      await resincronizarSpeciesPokeApiMestre(config.speciesId)
      await carregarConfig(config.speciesId)
      await carregarSpecies(busca.trim())
    } catch (e) {
      setErro(e.message || 'Erro ao resincronizar espécie')
    } finally {
      setSaving(false)
    }
  }

  const normalizarOrdemLearnset = async () => {
    if (!config?.speciesId) return
    setErro('')
    setSaving(true)
    try {
      const salvo = await normalizarOrdemLearnsetMestre(config.speciesId)
      setConfig({
        ...salvo,
        habilidades: Array.isArray(salvo?.habilidades) ? salvo.habilidades : [],
        learnset: Array.isArray(salvo?.learnset) ? salvo.learnset : [],
      })
    } catch (e) {
      setErro(e.message || 'Erro ao normalizar ordem do learnset')
    } finally {
      setSaving(false)
    }
  }

  if (usuario && !usuario.mestre) {
    return <div className="container"><p style={{ color: 'var(--danger)' }}>Acesso restrito a mestre.</p></div>
  }

  return (
    <div className="container container--wide">
      <h1 style={{ marginTop: 0 }}>Configuração de espécies</h1>
      <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>
        Defina habilidades possíveis da espécie (incluindo hidden ability) e learnset completo por método/nível.
      </p>
      {erro && <p style={{ color: 'var(--danger)' }}>{erro}</p>}

      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar espécie por nome"
            style={{ flex: 1, minWidth: 240 }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onBuscar())}
          />
          <button type="button" className="btn btn-primary" onClick={onBuscar}>Buscar</button>
          <button type="button" className="btn btn-secondary" onClick={() => { setBusca(''); carregarSpecies('') }}>Limpar</button>
        </div>
        <div style={{ marginTop: '0.75rem', maxHeight: 280, overflow: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
          {(speciesLista || []).map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => onSelecionarSpecies(sp)}
              className="btn btn-secondary"
              style={{
                width: '100%',
                textAlign: 'left',
                borderRadius: 0,
                border: 'none',
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: speciesSelecionada?.id === sp.id ? 'rgba(255,255,255,0.08)' : 'transparent',
              }}
            >
              <span style={{ width: 46, color: 'var(--text-muted)' }}>#{sp.pokedexId}</span>
              {sp.imagemUrl ? <img src={sp.imagemUrl} alt={sp.nome} style={{ width: 28, height: 28 }} /> : null}
              <span>{sp.nome}</span>
            </button>
          ))}
          {speciesLista.length === 0 && <p style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>Nenhuma espécie encontrada.</p>}
        </div>
      </div>

      {loadingConfig && <p>Carregando configuração...</p>}
      {!loadingConfig && config && (
        <>
          <div className="card" style={{ marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0 }}>{config.nome} (#{config.pokedexId})</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button type="button" className="btn btn-secondary" onClick={resincronizar} disabled={saving}>
                Resincronizar da PokéAPI
              </button>
              <button type="button" className="btn btn-secondary" onClick={normalizarOrdemLearnset} disabled={saving} title="Ordena por nível/método e renumera ordem 0, 1, 2…">
                Reordenar learnset
              </button>
              <button type="button" className="btn btn-primary" onClick={salvar} disabled={saving}>
                {saving ? 'Salvando...' : 'Salvar alterações'}
              </button>
            </div>
          </div>

          <div className="card" style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Habilidades</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addHabilidade}>Adicionar</button>
            </div>
            {(config.habilidades || []).map((h, idx) => (
              <div key={`${idx}-${h.habilidadeId || 'novo'}`} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 110px auto', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <select
                  value={h.habilidadeId || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.habilidades]
                      arr[idx] = { ...arr[idx], habilidadeId: v }
                      return { ...prev, habilidades: arr }
                    })
                  }}
                >
                  <option value="">Selecione</option>
                  {habilidades.map((opt) => (
                    <option key={opt.id} value={opt.id}>{abilityLabel(opt)}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={h.slot ?? 1}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.habilidades]
                      arr[idx] = { ...arr[idx], slot: v }
                      return { ...prev, habilidades: arr }
                    })
                  }}
                  placeholder="Slot"
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', justifyContent: 'center' }}>
                  <input
                    type="checkbox"
                    checked={!!h.hidden}
                    onChange={(e) => {
                      const checked = e.target.checked
                      setConfig((prev) => {
                        if (!prev) return prev
                        const arr = [...prev.habilidades]
                        arr[idx] = { ...arr[idx], hidden: checked }
                        return { ...prev, habilidades: arr }
                      })
                    }}
                  />
                  Hidden
                </label>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setConfig((prev) => prev ? { ...prev, habilidades: prev.habilidades.filter((_, i) => i !== idx) } : prev)
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            {config.habilidades.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sem habilidades cadastradas.</p>}
          </div>

          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Learnset</h3>
              <button type="button" className="btn btn-secondary btn-sm" onClick={addLearnset}>Adicionar</button>
            </div>
            {(config.learnset || []).map((m, idx) => (
              <div key={`${idx}-${m.movimentoId || 'novo'}`} style={{ display: 'grid', gridTemplateColumns: '1.4fr 150px 90px 90px auto', gap: '0.5rem', marginBottom: '0.4rem' }}>
                <select
                  value={m.movimentoId || ''}
                  onChange={(e) => {
                    const v = e.target.value
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.learnset]
                      arr[idx] = { ...arr[idx], movimentoId: v }
                      return { ...prev, learnset: arr }
                    })
                  }}
                >
                  <option value="">Selecione</option>
                  {movimentos.map((opt) => (
                    <option key={opt.id} value={opt.id}>{moveLabel(opt)}</option>
                  ))}
                </select>
                <select
                  value={m.learnMethod || 'LEVEL_UP'}
                  onChange={(e) => {
                    const method = e.target.value
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.learnset]
                      arr[idx] = { ...arr[idx], learnMethod: method, level: method === 'LEVEL_UP' ? (arr[idx].level || 1) : null }
                      return { ...prev, learnset: arr }
                    })
                  }}
                >
                  {METHODS.map((method) => (
                    <option key={method} value={method}>{method}</option>
                  ))}
                </select>
                <input
                  type="number"
                  min={1}
                  value={m.level ?? ''}
                  disabled={(m.learnMethod || 'LEVEL_UP') !== 'LEVEL_UP'}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10) || 1
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.learnset]
                      arr[idx] = { ...arr[idx], level: v }
                      return { ...prev, learnset: arr }
                    })
                  }}
                  placeholder="Nível"
                />
                <input
                  type="number"
                  value={m.ordem ?? idx}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10)
                    setConfig((prev) => {
                      if (!prev) return prev
                      const arr = [...prev.learnset]
                      arr[idx] = { ...arr[idx], ordem: Number.isFinite(v) ? v : idx }
                      return { ...prev, learnset: arr }
                    })
                  }}
                  placeholder="Ordem"
                />
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() =>
                    setConfig((prev) => prev ? { ...prev, learnset: prev.learnset.filter((_, i) => i !== idx) } : prev)
                  }
                >
                  Remover
                </button>
              </div>
            ))}
            {config.learnset.length === 0 && <p style={{ color: 'var(--text-muted)' }}>Sem movimentos cadastrados.</p>}
          </div>

          {/* Mostra nomes originais dos IDs selecionados quando necessário */}
          <div className="card" style={{ marginTop: '1rem' }}>
            <h4 style={{ marginTop: 0 }}>Resumo rápido</h4>
            <p style={{ marginBottom: '0.35rem' }}>
              Habilidades: {(config.habilidades || []).filter((h) => h.habilidadeId).map((h) => abilityLabel(habilidadePorId.get(h.habilidadeId))).join(', ') || '—'}
            </p>
            <p style={{ margin: 0 }}>
              Learnset: {(config.learnset || []).filter((m) => m.movimentoId).slice(0, 12).map((m) => moveLabel(movimentoPorId.get(m.movimentoId))).join(', ') || '—'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import {
  getHabilidades,
  getMovimentos,
  getUsuario,
  getSpeciesConfigMestre,
  importarTodasSpeciesPokeApiMestre,
  listarSpeciesMestre,
  normalizarOrdemLearnsetMestre,
  resincronizarSpeciesPokeApiMestre,
  salvarSpeciesConfigMestre,
  vincularSpeciesExistentesPokeApiMestre,
} from '../api'

const METHODS = ['LEVEL_UP', 'MACHINE', 'TUTOR', 'EGG', 'OTHER']
const SPECIES_CACHE_KEY = 'pokemonamethyst:species-local-cache:v1'
const SPECIES_CACHE_VERSION_KEY = 'pokemonamethyst:species-local-version:v1'
const HABILIDADES_CACHE_KEY = 'pokemonamethyst:mestre:habilidades-cache:v1'
const MOVIMENTOS_CACHE_KEY = 'pokemonamethyst:mestre:movimentos-cache:v1'
const CATALOGO_CACHE_TTL_MS = 24 * 60 * 60 * 1000

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

function readCatalogCache(cacheKey) {
  try {
    const raw = localStorage.getItem(cacheKey)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || !Array.isArray(parsed.lista) || typeof parsed.ts !== 'number') return null
    if (Date.now() - parsed.ts > CATALOGO_CACHE_TTL_MS) return null
    return parsed.lista
  } catch {
    return null
  }
}

function writeCatalogCache(cacheKey, lista) {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({
      ts: Date.now(),
      lista: Array.isArray(lista) ? lista : [],
    }))
  } catch {
    // armazenamento local é opcional
  }
}

export default function MestreSpecies() {
  const [usuario, setUsuario] = useState(null)
  const [erro, setErro] = useState('')
  const [saving, setSaving] = useState(false)
  const [importandoTodas, setImportandoTodas] = useState(false)
  const [vinculandoExistentes, setVinculandoExistentes] = useState(false)
  const [statusImportacao, setStatusImportacao] = useState('')
  const [loadingConfig, setLoadingConfig] = useState(false)
  const [speciesLista, setSpeciesLista] = useState([])
  const [speciesSelecionada, setSpeciesSelecionada] = useState(null)
  const [config, setConfig] = useState(null)
  const [habilidades, setHabilidades] = useState([])
  const [movimentos, setMovimentos] = useState([])
  const [catalogoLoading, setCatalogoLoading] = useState(false)
  const [filtroHabilidades, setFiltroHabilidades] = useState('')
  const [filtroMovimentos, setFiltroMovimentos] = useState('')
  const buscaInputRef = useRef(null)
  const catalogoPromiseRef = useRef(null)

  const invalidarCatalogoLocalCache = () => {
    try {
      localStorage.removeItem(SPECIES_CACHE_KEY)
      localStorage.removeItem(SPECIES_CACHE_VERSION_KEY)
    } catch {
      // cache local é opcional
    }
  }

  const carregarSpecies = async (nome = '') => {
    const lista = await listarSpeciesMestre({ nome, limit: 120 })
    setSpeciesLista(Array.isArray(lista) ? lista : [])
  }

  useEffect(() => {
    Promise.all([
      getUsuario().then(setUsuario).catch(() => setUsuario(null)),
      carregarSpecies(''),
    ]).catch((e) => setErro(e.message || 'Erro ao carregar dados iniciais'))
  }, [])

  const ensureCatalogos = async () => {
    if (movimentos.length > 0 && habilidades.length > 0) return
    if (catalogoPromiseRef.current) {
      await catalogoPromiseRef.current
      return
    }
    const promessa = (async () => {
      setCatalogoLoading(true)
      try {
        const movimentosCache = readCatalogCache(MOVIMENTOS_CACHE_KEY)
        const habilidadesCache = readCatalogCache(HABILIDADES_CACHE_KEY)
        if (Array.isArray(movimentosCache) && movimentosCache.length > 0) setMovimentos(movimentosCache)
        if (Array.isArray(habilidadesCache) && habilidadesCache.length > 0) setHabilidades(habilidadesCache)

        const needsMovimentos = !(Array.isArray(movimentosCache) && movimentosCache.length > 0)
        const needsHabilidades = !(Array.isArray(habilidadesCache) && habilidadesCache.length > 0)
        if (!needsMovimentos && !needsHabilidades) return

        const [movs, habs] = await Promise.all([
          needsMovimentos ? getMovimentos().catch(() => []) : Promise.resolve(movimentosCache || []),
          needsHabilidades ? getHabilidades().catch(() => []) : Promise.resolve(habilidadesCache || []),
        ])
        const movsSeguro = Array.isArray(movs) ? movs : []
        const habsSeguro = Array.isArray(habs) ? habs : []
        setMovimentos(movsSeguro)
        setHabilidades(habsSeguro)
        if (movsSeguro.length > 0) writeCatalogCache(MOVIMENTOS_CACHE_KEY, movsSeguro)
        if (habsSeguro.length > 0) writeCatalogCache(HABILIDADES_CACHE_KEY, habsSeguro)
      } finally {
        setCatalogoLoading(false)
        catalogoPromiseRef.current = null
      }
    })()
    catalogoPromiseRef.current = promessa
    await promessa
  }

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
      await carregarSpecies((buscaInputRef.current?.value || '').trim())
    } catch (e) {
      setErro(e.message || 'Erro ao buscar espécies')
    }
  }

  const importarTodasSpecies = async () => {
    if (importandoTodas) return
    if (!window.confirm('Isso pode demorar alguns minutos. Deseja importar todas as espécies da PokéAPI agora?')) return
    setErro('')
    setStatusImportacao('')
    setImportandoTodas(true)
    try {
      const resultado = await importarTodasSpeciesPokeApiMestre()
      invalidarCatalogoLocalCache()
      await carregarSpecies((buscaInputRef.current?.value || '').trim())
      const total = Number(resultado?.totalPokeApi || 0)
      const jaExistentes = Number(resultado?.jaExistentes || 0)
      const importadas = Number(resultado?.importadas || 0)
      const falhas = Number(resultado?.falhas || 0)
      const idsComFalha = Array.isArray(resultado?.idsComFalha) ? resultado.idsComFalha : []
      setStatusImportacao(
        `Importação concluída. Total na PokéAPI: ${total}. Novas importadas: ${importadas}. Já existentes: ${jaExistentes}. Falhas: ${falhas}.`
      )
      if (falhas > 0 && idsComFalha.length > 0) {
        setErro(`Algumas espécies falharam (amostra): ${idsComFalha.join(', ')}`)
      }
    } catch (e) {
      setErro(e.message || 'Erro ao importar todas as espécies')
    } finally {
      setImportandoTodas(false)
    }
  }

  const vincularSpeciesExistentes = async () => {
    if (vinculandoExistentes) return
    if (!window.confirm('Esse processo vai completar habilidades e learnset apenas nas espécies locais que estiverem incompletas. Deseja continuar?')) return
    setErro('')
    setStatusImportacao('')
    setVinculandoExistentes(true)
    try {
      const resultado = await vincularSpeciesExistentesPokeApiMestre()
      invalidarCatalogoLocalCache()
      await carregarSpecies((buscaInputRef.current?.value || '').trim())
      const total = Number(resultado?.totalSpeciesLocais || 0)
      const completas = Number(resultado?.completasSemAlteracao || 0)
      const vinculadas = Number(resultado?.vinculadas || 0)
      const falhas = Number(resultado?.falhas || 0)
      const idsComFalha = Array.isArray(resultado?.idsComFalha) ? resultado.idsComFalha : []
      setStatusImportacao(
        `Vínculos concluídos. Species locais: ${total}. Já completas: ${completas}. Vinculadas: ${vinculadas}. Falhas: ${falhas}.`
      )
      if (falhas > 0 && idsComFalha.length > 0) {
        setErro(`Falhas ao vincular (amostra de Pokédex IDs): ${idsComFalha.join(', ')}`)
      }
    } catch (e) {
      setErro(e.message || 'Erro ao vincular espécies existentes')
    } finally {
      setVinculandoExistentes(false)
    }
  }

  const onSelecionarSpecies = async (sp) => {
    await ensureCatalogos()
    setSpeciesSelecionada(sp)
    await carregarConfig(sp.id)
  }
  const habilidadesFiltradas = useMemo(() => {
    const filtro = filtroHabilidades.trim().toLowerCase()
    const base = !filtro
      ? habilidades
      : habilidades.filter((h) => {
          const nome = String(h?.nome || '').toLowerCase()
          const nomeEn = String(h?.nomeEn || '').toLowerCase()
          const id = String(h?.id || '').toLowerCase()
          return nome.includes(filtro) || nomeEn.includes(filtro) || id.includes(filtro)
        })
    return base.slice(0, 120)
  }, [habilidades, filtroHabilidades])

  const movimentosFiltrados = useMemo(() => {
    const filtro = filtroMovimentos.trim().toLowerCase()
    const base = !filtro
      ? movimentos
      : movimentos.filter((m) => {
          const nome = String(m?.nome || '').toLowerCase()
          const nomeEn = String(m?.nomeEn || '').toLowerCase()
          const id = String(m?.id || '').toLowerCase()
          return nome.includes(filtro) || nomeEn.includes(filtro) || id.includes(filtro)
        })
    return base.slice(0, 120)
  }, [movimentos, filtroMovimentos])


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
      invalidarCatalogoLocalCache()
      await carregarSpecies((buscaInputRef.current?.value || '').trim())
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
      invalidarCatalogoLocalCache()
      await carregarConfig(config.speciesId)
      await carregarSpecies((buscaInputRef.current?.value || '').trim())
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
      invalidarCatalogoLocalCache()
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
            defaultValue=""
            ref={buscaInputRef}
            placeholder="Buscar espécie por nome"
            style={{ flex: 1, minWidth: 240 }}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onBuscar())}
          />
          <button type="button" className="btn btn-primary" onClick={onBuscar}>Buscar</button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              if (buscaInputRef.current) buscaInputRef.current.value = ''
              carregarSpecies('')
            }}
          >
            Limpar
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={importarTodasSpecies}
            disabled={saving || importandoTodas || vinculandoExistentes}
            title="Importa em lote todas as espécies que ainda não foram salvas localmente"
          >
            {importandoTodas ? 'Importando espécies...' : 'Importar todas da PokéAPI'}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={vincularSpeciesExistentes}
            disabled={saving || importandoTodas || vinculandoExistentes}
            title="Completa habilidades/learnset de espécies locais incompletas"
          >
            {vinculandoExistentes ? 'Vinculando species...' : 'Vincular species existentes'}
          </button>
        </div>
        {statusImportacao && <p style={{ margin: '0.65rem 0 0', color: 'var(--text-muted)' }}>{statusImportacao}</p>}
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
            <input
              type="text"
              value={filtroHabilidades}
              onChange={(e) => setFiltroHabilidades(e.target.value)}
              placeholder="Filtrar habilidades (nome, EN ou id)"
              style={{ width: '100%', marginBottom: '0.6rem' }}
            />
            {catalogoLoading && <p style={{ color: 'var(--text-muted)', marginTop: 0 }}>Carregando catálogo de habilidades/movimentos...</p>}
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
                  {!habilidadesFiltradas.some((opt) => opt.id === h.habilidadeId) && h.habilidadeId && habilidadePorId.get(h.habilidadeId) ? (
                    <option value={h.habilidadeId}>{abilityLabel(habilidadePorId.get(h.habilidadeId))}</option>
                  ) : null}
                  {habilidadesFiltradas.map((opt) => (
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
            <input
              type="text"
              value={filtroMovimentos}
              onChange={(e) => setFiltroMovimentos(e.target.value)}
              placeholder="Filtrar movimentos (nome, EN ou id)"
              style={{ width: '100%', marginBottom: '0.6rem' }}
            />
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
                  {!movimentosFiltrados.some((opt) => opt.id === m.movimentoId) && m.movimentoId && movimentoPorId.get(m.movimentoId) ? (
                    <option value={m.movimentoId}>{moveLabel(movimentoPorId.get(m.movimentoId))}</option>
                  ) : null}
                  {movimentosFiltrados.map((opt) => (
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

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabaseClient = null

export function isPokemonSpriteUploadConfigured() {
  return Boolean(supabaseUrl && supabaseAnonKey)
}

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para usar upload de sprite.')
  }
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey)
  return supabaseClient
}

export async function uploadPokemonSprite(file, pokemonId) {
  if (!file) {
    throw new Error('Selecione uma imagem para enviar.')
  }
  const client = getSupabaseClient()
  const extension = (file.name.split('.').pop() || 'png').toLowerCase()
  const safeName = `${pokemonId || 'pokemon'}-${Date.now()}.${extension}`
  const filePath = `sprites/${safeName}`

  const { error: uploadError } = await client.storage
    .from('pokemon-sprites')
    .upload(filePath, file, {
      upsert: true,
      contentType: file.type || 'image/png',
      cacheControl: '3600',
    })

  if (uploadError) {
    throw new Error(uploadError.message || 'Erro ao enviar sprite para o Supabase.')
  }

  const { data } = client.storage.from('pokemon-sprites').getPublicUrl(filePath)
  if (!data?.publicUrl) {
    throw new Error('Não foi possível obter a URL pública do sprite.')
  }

  return { filePath, publicUrl: data.publicUrl }
}


import { useEffect, useState } from 'react'
import { supabase } from './supabase'

const CONFIG_INICIAL = {
  logo_url: '',
  local_url: '',
  portada_url: '',
  galeria: [],
  color_principal: '#111111',
  color_secundario: '#D4AF37',
  color_fondo: '#FFFFFF',
  color_texto: '#111111',
  nombre_publico: '',
  descripcion: '',
  diseno: 'clasico'
}

export default function PersonalizarNegocio({ negocio }) {
  const [config, setConfig] = useState(CONFIG_INICIAL)
  const [configId, setConfigId] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [servicios, setServicios] = useState([])
const [cargandoServicios, setCargandoServicios] = useState(true)

  useEffect(() => {
    if (!negocio?.id) return

    const cargar = async () => {
      setCargando(true)

      const { data, error } = await supabase
        .from('personalizacion_negocios')
        .select('*')
        .eq('negocio_id', negocio.id)
        .maybeSingle()

      if (error) {
        setMensaje('Error al cargar: ' + error.message)
      } else if (data) {
        setConfig({
          ...CONFIG_INICIAL,
          ...data,
          galeria: data.galeria || []
        })
        setConfigId(data.id)
      } else {
        setConfig({
          ...CONFIG_INICIAL,
          nombre_publico: negocio.nombre || ''
        })
        setConfigId(null)
      }

      setCargando(false)
    }

    cargar()
  }, [negocio?.id])

  const guardarDatos = async (datos) => {
    console.log('INICIANDO GUARDADO', datos)
    if (!negocio?.id) return false

    setGuardando(true)
    setMensaje('')

    const valores = {
      ...datos,
      negocio_id: negocio.id,
      updated_at: new Date().toISOString()
    }

    let resultado

    if (configId) {
      resultado = await supabase
        .from('personalizacion_negocios')
        .update(valores)
        .eq('id', configId)
    } else {
      resultado = await supabase
        .from('personalizacion_negocios')
        .insert(valores)
        .select('id')
        .single()

      if (!resultado.error) {
        setConfigId(resultado.data.id)
      }
    }
console.log('RESPUESTA DE SUPABASE:', resultado)
    setGuardando(false)

    if (resultado.error) {
      setMensaje('Error: ' + resultado.error.message)
      return false
    }

    setMensaje('¡Personalización guardada correctamente!')
    console.log('MENSAJE ACTUALIZADO')
    return true
  }
useEffect(() => {
  if (!negocio?.id) return

  const cargarServicios = async () => {
    setCargandoServicios(true)

    const { data, error } = await supabase
      .from('servicios')
      .select('id, negocio_id, nombre, precio, duracion, imagen_url')
      .eq('negocio_id', negocio.id)
      .order('id', { ascending: true })

    if (error) {
      console.error('Error al cargar servicios:', error)
      setMensaje('Error al cargar servicios: ' + error.message)
    } else {
      setServicios(data || [])
    }

    setCargandoServicios(false)
  }

  cargarServicios()
}, [negocio?.id])
  const cambiarCampo = (campo, valor) => {
    setConfig(actual => ({
      ...actual,
      [campo]: valor
    }))
  }

  const subirImagen = async (archivo, tipo) => {
    if (!archivo || !negocio?.id) return

    if (!archivo.type.startsWith('image/')) {
      setMensaje('Seleccioná un archivo de imagen.')
      return
    }

    if (archivo.size > 5 * 1024 * 1024) {
      setMensaje('La imagen no puede superar los 5 MB.')
      return
    }

    setGuardando(true)
    setMensaje('Subiendo imagen...')

    const extension = archivo.name.split('.').pop()
    const ruta = `${negocio.id}/${tipo}-${Date.now()}.${extension}`

    const { error } = await supabase.storage
      .from('personalizacion-negocios')
      .upload(ruta, archivo, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      setGuardando(false)
      setMensaje('Error al subir imagen: ' + error.message)
      return
    }

    const { data } = supabase.storage
      .from('personalizacion-negocios')
      .getPublicUrl(ruta)

    const nuevoValor = {
      ...config,
      [tipo]: data.publicUrl
    }

    setConfig(nuevoValor)
    await guardarDatos(nuevoValor)
  }
const subirImagenServicio = async (archivo, servicio) => {
  if (!archivo || !servicio?.id || !negocio?.id) return

  if (!archivo.type.startsWith('image/')) {
    setMensaje('Seleccioná un archivo de imagen.')
    return
  }

  if (archivo.size > 5 * 1024 * 1024) {
    setMensaje('La imagen no puede superar los 5 MB.')
    return
  }

  setGuardando(true)
  setMensaje('Subiendo imagen del servicio...')

  const extension = archivo.name.split('.').pop()
  const ruta = `${negocio.id}/servicios/${servicio.id}-${Date.now()}.${extension}`

  const { error: errorSubida } = await supabase.storage
    .from('personalizacion-negocios')
    .upload(ruta, archivo, {
      cacheControl: '3600',
      upsert: false
    })

  if (errorSubida) {
    setGuardando(false)
    setMensaje('Error al subir imagen: ' + errorSubida.message)
    return
  }

  const { data } = supabase.storage
    .from('personalizacion-negocios')
    .getPublicUrl(ruta)

  const { error: errorActualizacion } = await supabase
    .from('servicios')
    .update({ imagen_url: data.publicUrl })
    .eq('id', servicio.id)
    .eq('negocio_id', negocio.id)

  if (errorActualizacion) {
    setGuardando(false)
    setMensaje('La imagen se subió, pero no se pudo guardar: ' + errorActualizacion.message)
    return
  }

  setServicios(actuales =>
    actuales.map(item =>
      item.id === servicio.id
        ? { ...item, imagen_url: data.publicUrl }
        : item
    )
  )

  setGuardando(false)
  setMensaje('¡Imagen del servicio actualizada correctamente!')
}
  const subirImagenLocal = async (archivo) => {
  if (!archivo || !negocio?.id) return

  if (!archivo.type.startsWith('image/')) {
    setMensaje('Seleccioná un archivo de imagen.')
    return
  }

  if (archivo.size > 5 * 1024 * 1024) {
    setMensaje('La imagen no puede superar los 5 MB.')
    return
  }

  setGuardando(true)
  setMensaje('Subiendo foto del local...')

  const extension = archivo.name.split('.').pop()
  const ruta = `${negocio.id}/local/local-${Date.now()}.${extension}`

  const { error: errorSubida } = await supabase.storage
    .from('personalizacion-negocios')
    .upload(ruta, archivo, {
      cacheControl: '3600',
      upsert: false
    })

  if (errorSubida) {
    setGuardando(false)
    setMensaje('Error al subir imagen: ' + errorSubida.message)
    return
  }

  const { data } = supabase.storage
    .from('personalizacion-negocios')
    .getPublicUrl(ruta)

  const nuevaConfig = {
    ...config,
    local_url: data.publicUrl
  }

  setConfig(nuevaConfig)

  const guardado = await guardarDatos({
    local_url: data.publicUrl
  })

  setGuardando(false)

  if (guardado) {
    setMensaje('¡Foto del local actualizada correctamente!')
  }
}
const subirGaleria = async (archivos) => {
    for (const archivo of Array.from(archivos || [])) {
      if (!archivo.type.startsWith('image/')) continue

      if (archivo.size > 5 * 1024 * 1024) {
        setMensaje(`La imagen ${archivo.name} supera los 5 MB.`)
        continue
      }

      setGuardando(true)

      const ruta = `${negocio.id}/galeria-${Date.now()}-${Math.random().toString(36).slice(2)}.${archivo.name.split('.').pop()}`

      const { error } = await supabase.storage
        .from('personalizacion-negocios')
        .upload(ruta, archivo)

      if (error) {
        setMensaje(error.message)
        setGuardando(false)
        continue
      }

      const { data } = supabase.storage
        .from('personalizacion-negocios')
        .getPublicUrl(ruta)

      const nuevaGaleria = [
        ...config.galeria,
        data.publicUrl
      ]

      const nuevaConfig = {
        ...config,
        galeria: nuevaGaleria
      }

      setConfig(nuevaConfig)
      await guardarDatos(nuevaConfig)
    }

    setGuardando(false)
  }

  if (!negocio) {
    return <p>No se seleccionó ningún negocio.</p>
  }

  if (cargando) {
    return <p>Cargando personalización...</p>
  }

  const campoTexto = {
    width: '100%',
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #444',
    background: '#171717',
    color: '#fff',
    marginTop: '8px'
  }

  const bloque = {
    background: '#171717',
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '20px',
    marginBottom: '20px'
  }

  return (
    <section style={{ maxWidth: '900px', margin: '24px auto' }}>
      <h2>Personalizar página</h2>
      <p>
        Configurá la apariencia de {negocio.nombre}.
        Estos cambios pertenecen solamente a este negocio.
      </p>

{mensaje !== '' && (
  <div style={{
    display: 'block',
    background: '#14532d',
    color: '#ffffff',
    padding: '15px',
    margin: '15px 0',
    borderRadius: '10px',
    fontWeight: 'bold',
    fontSize: '16px'
  }}>
    {mensaje}
  </div>
)}

      <div style={bloque}>
        <h3>Identidad del negocio</h3>

        <label>Nombre público</label>
        <input
          style={campoTexto}
          value={config.nombre_publico}
          onChange={e => cambiarCampo('nombre_publico', e.target.value)}
          placeholder="Nombre que verán tus clientes"
        />

        <label style={{ display: 'block', marginTop: '15px' }}>
          Descripción
        </label>
        <textarea
          style={{ ...campoTexto, minHeight: '100px' }}
          value={config.descripcion}
          onChange={e => cambiarCampo('descripcion', e.target.value)}
          placeholder="Contá qué ofrece tu negocio..."
        />
      </div>

      <div style={bloque}>
        <h3>Logo y portada</h3>

        <label>Logo</label>
        <input
          type="file"
          accept="image/*"
          onChange={e => subirImagen(e.target.files?.[0], 'logo_url')}
        />

        {config.logo_url && (
          <img
            src={config.logo_url}
            alt="Logo"
            style={{ display: 'block', maxWidth: '160px', maxHeight: '120px', objectFit: 'contain', marginTop: '15px' }}
          />
        )}

        <label style={{ display: 'block', marginTop: '25px' }}>
          Foto de portada
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={e => subirImagen(e.target.files?.[0], 'portada_url')}
        />

        {config.portada_url && (
          <img
            src={config.portada_url}
            alt="Portada"
            style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '10px', marginTop: '15px' }}
          />
        )}
      </div>

      <div style={bloque}>
        <h3>Colores de la página</h3>

        {[
          ['color_principal', 'Color principal'],
          ['color_secundario', 'Color secundario'],
          ['color_fondo', 'Color de fondo'],
          ['color_texto', 'Color del texto']
        ].map(([campo, titulo]) => (
          <label key={campo} style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            margin: '15px 0'
          }}>
            {titulo}
            <input
              type="color"
              value={config[campo]}
              onChange={e => cambiarCampo(campo, e.target.value)}
            />
          </label>
        ))}
      </div>

      <div style={bloque}>
        <h3>Diseño de la página</h3>

        <select
          style={campoTexto}
          value={config.diseno}
          onChange={e => cambiarCampo('diseno', e.target.value)}
        >
          <option value="clasico">Clásico</option>
          <option value="moderno">Moderno</option>
          <option value="elegante">Elegante</option>
        </select>
      </div>
<div style={bloque}>
  <h3>Imágenes de servicios</h3>

  <p style={{ color: '#aaa' }}>
    Elegí una foto para cada servicio. Cada imagen se mostrará en la página pública de tu negocio.
  </p>

  {cargandoServicios ? (
    <p>Cargando servicios...</p>
  ) : servicios.length === 0 ? (
    <p>No hay servicios registrados en este negocio.</p>
  ) : (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
      gap: '18px',
      marginTop: '20px'
    }}>
      {servicios.map(servicio => (
        <div
          key={servicio.id}
          style={{
            background: '#222',
            border: '1px solid #444',
            borderRadius: '12px',
            padding: '15px'
          }}
        >
          <h4>{servicio.nombre}</h4>

          {servicio.imagen_url ? (
            <img
              src={servicio.imagen_url}
              alt={servicio.nombre}
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '12px'
              }}
            />
          ) : (
            <div style={{
              height: '150px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#333',
              borderRadius: '8px',
              color: '#aaa',
              marginBottom: '12px'
            }}>
              Sin imagen
            </div>
          )}

          <label style={{ display: 'block', color: '#fff' }}>
            Subir imagen
            <input
              type="file"
              accept="image/*"
              disabled={guardando}
              style={{
                display: 'block',
                width: '100%',
                marginTop: '10px'
              }}
              onChange={e => {
                subirImagenServicio(e.target.files?.[0], servicio)
                e.target.value = ''
              }}
            />
          </label>
        </div>
      ))}
    </div>
  )}
</div>
      <div style={bloque}>
       <div style={bloque}>
  <h3>Foto de nuestro local</h3>

  <p style={{ color: '#aaa' }}>
    Subí una foto del establecimiento para mostrarla en tu página pública.
  </p>

  {config.local_url && (
    <img
      src={config.local_url}
      alt="Foto del local"
      style={{
        width: '100%',
        maxWidth: '400px',
        height: '220px',
        objectFit: 'cover',
        borderRadius: '12px',
        display: 'block',
        marginBottom: '15px'
      }}
    />
  )}

  <label style={{ display: 'block', color: '#fff' }}>
    Seleccionar foto del local
    <input
      type="file"
      accept="image/*"
      disabled={guardando}
      style={{
        display: 'block',
        width: '100%',
        marginTop: '10px'
      }}
      onChange={e => {
        subirImagenLocal(e.target.files?.[0])
        e.target.value = ''
      }}
    />
  </label>
</div>
        <h3>Galería de fotos</h3>

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={e => subirGaleria(e.target.files)}
        />

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
          gap: '12px',
          marginTop: '20px'
        }}>
          {config.galeria.map((url, index) => (
            <div key={index}>
              <img
                src={url}
                alt={`Galería ${index + 1}`}
                style={{ width: '100%', height: '110px', objectFit: 'cover', borderRadius: '8px' }}
              />
              <button
                type="button"
                onClick={() => cambiarCampo(
                  'galeria',
                  config.galeria.filter((_, i) => i !== index)
                )}
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        disabled={guardando}
        onClick={() => guardarDatos(config)}
        style={{
          background: '#16a34a',
          color: '#fff',
          padding: '14px 24px',
          border: 'none',
          borderRadius: '9px',
          cursor: 'pointer',
          fontWeight: 'bold'
        }}
      >
        {guardando ? 'Guardando...' : 'Guardar personalización'}
      </button>
    </section>
  )
}

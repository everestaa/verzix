
import { useEffect, useState } from 'react'
import { supabase } from './supabase'

function PaginaNegocio() {
  const [negocio, setNegocio] = useState(null)
  const [personalizacion, setPersonalizacion] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')
  const [servicios, setServicios] = useState([])
  const [servicioSeleccionado, setServicioSeleccionado] = useState('')
const [fechaSeleccionada, setFechaSeleccionada] = useState('')
const [horaSeleccionada, setHoraSeleccionada] = useState('')
const [horariosDisponibles, setHorariosDisponibles] = useState([])
const [clienteNombre, setClienteNombre] = useState('')
const [clienteWhatsapp, setClienteWhatsapp] = useState('')
const [mensajeReserva, setMensajeReserva] = useState('')
const [enlaceWhatsapp, setEnlaceWhatsapp] = useState('')
const [guardandoReserva, setGuardandoReserva] = useState(false)

  useEffect(() => {
    const cargarNegocio = async () => {
      const slug = window.location.pathname.split('/').filter(Boolean)[0]

      const { data, error } = await supabase
  .from('negocios_publicos')
  .select('id, nombre, direccion, tipo, hora_apertura, hora_cierre, dias_atencion, slug, whatsapp')
        .eq('slug', slug)
        .maybeSingle()

      if (error) {
        setError('No se pudo cargar el negocio.')
      } else if (!data) {
        setError('No encontramos este negocio.')
} else {
  setNegocio(data)

  const { data: personalizacionData, error: personalizacionError } = await supabase
    .from('personalizacion_negocios')
    .select('*')
    .eq('negocio_id', data.id)
    .maybeSingle()

  if (personalizacionError) {
    console.error('Error al cargar personalización:', personalizacionError)
  }

  setPersonalizacion(personalizacionData || null)

  const { data: serviciosData, error: serviciosError } = await supabase
    .from('servicios_publicos')
    .select('*')
    .eq('negocio_id', data.id)

  if (serviciosError) {
    setError('No se pudieron cargar los servicios.')
  } else {
    setServicios(serviciosData || [])
console.table(serviciosData)
  }
}

      setCargando(false)
    }

    cargarNegocio()
  }, [])
const cargarHorarios = async (fecha, servicioId) => {
  setHoraSeleccionada('')
  setMensajeReserva('')
  setHorariosDisponibles([])

  if (!fecha || !servicioId || !negocio) return

  const slug = window.location.pathname.split('/').filter(Boolean)[0]

const { data, error } = await supabase.rpc('horarios_disponibles', {
  p_slug: slug,
  p_servicio_id: Number(servicioId),
  p_fecha: String(fecha).slice(0, 10)
})
  if (error) {
    setMensajeReserva('Error al consultar horarios: ' + error.message)
    return
  }

  setHorariosDisponibles(
    (data || []).map((item) => item.hora.slice(0, 5))
  )
}


const registrarReservaPublica = async () => {
  if (
    !servicioSeleccionado ||
    !fechaSeleccionada ||
    !horaSeleccionada ||
    !clienteNombre.trim() ||
    !clienteWhatsapp.trim()
  ) {
    setMensajeReserva('Completá todos los campos.')
    return
  }

  setGuardandoReserva(true)
  setMensajeReserva('')
  setEnlaceWhatsapp('')

  const slug = window.location.pathname.split('/').filter(Boolean)[0]

  const { data, error } = await supabase.rpc('reservar_turno', {
    p_slug: slug,
    p_servicio_id: Number(servicioSeleccionado),
    p_cliente_nombre: clienteNombre.trim(),
    p_cliente_whatsapp: clienteWhatsapp.trim(),
    p_fecha: fechaSeleccionada,
    p_hora: horaSeleccionada
  })

  setGuardandoReserva(false)

  if (error) {
    setMensajeReserva(error.message)
    await cargarHorarios(fechaSeleccionada, servicioSeleccionado)
    return
  }

  const servicio = servicios.find(
    (item) => String(item.id) === String(servicioSeleccionado)
  )

  const codigoReserva = data?.reserva_id

  let telefono = String(negocio?.whatsapp || '').replace(/\D/g, '')

  if (telefono.startsWith('0')) {
    telefono = '595' + telefono.slice(1)
  }

  if (telefono && codigoReserva) {
    const mensaje = `Hola, acabo de realizar una reserva en ${negocio.nombre}.

Código de reserva: #${codigoReserva}
Cliente: ${clienteNombre.trim()}
Servicio: ${servicio?.nombre || ''}
Fecha: ${fechaSeleccionada}
Hora: ${horaSeleccionada}

¡Muchas gracias!`

    setEnlaceWhatsapp(
      `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`
    )
  }

  setClienteNombre('')
  setClienteWhatsapp('')
  setHoraSeleccionada('')

  await cargarHorarios(fechaSeleccionada, servicioSeleccionado)

  setMensajeReserva('¡Tu reserva fue registrada correctamente!')
}

  if (cargando) return <p>Cargando negocio...</p>
  if (error) return <p>{error}</p>

const nombrePublico =
  personalizacion?.nombre_publico?.trim() || negocio.nombre

const imagenPortada =
  personalizacion?.portada_url || '/images/barberia-junior/portada.jpg'

const imagenLogo =
  personalizacion?.logo_url || '/images/barberia-junior/logo.png'

return (
<main
className={`public-page diseno-${personalizacion?.diseno || 'clasico'}`}
  style={{
    backgroundColor: personalizacion?.color_fondo || undefined,
    color: personalizacion?.color_texto || undefined,
    '--color-principal': personalizacion?.color_principal || '#111111',
    '--color-secundario': personalizacion?.color_secundario || '#D4AF37',
    '--color-fondo': personalizacion?.color_fondo || '#FFFFFF',
    '--color-texto': personalizacion?.color_texto || '#111111'
  }}
>

    <header style={{
      backgroundImage: `linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,.8)), url('${imagenPortada}')`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      minHeight: '480px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      color: 'white',
      padding: '30px'
    }}>
<img
  src={imagenLogo}
  alt={`Logo de ${nombrePublico}`}
  style={{
    display: 'block',
    width: '150px',
    height: '150px',
    objectFit: 'contain',
    objectPosition: 'center center',
    margin: '0 auto',
    padding: '5px',
    boxSizing: 'border-box'
  }}
/>
      <h1 style={{ fontSize: '48px', margin: '15px 0' }}>
{nombrePublico}
      </h1>

<p className="subtitulo-negocio">
  {negocio.tipo} · {negocio.direccion || negocio.ciudad}
</p>
{personalizacion?.descripcion?.trim() && (
  <p style={{
    maxWidth: '650px',
    margin: '15px auto',
    fontSize: '17px',
    lineHeight: '1.6',
    color: '#ffffff'
  }}>
    {personalizacion.descripcion}
  </p>
)}

      <a href="#reservar" style={{
  background: 'var(--color-secundario)',
  color: 'var(--color-principal)',
        padding: '15px 30px',
        borderRadius: '8px',
        textDecoration: 'none',
        fontWeight: 'bold',
        marginTop: '20px'
      }}>
        RESERVAR TURNO
      </a>
    </header>

<section>

<h2>Nuestros servicios</h2>

{servicios.length === 0 ? (
  <p>Este negocio todavía no tiene servicios publicados.</p>
) : (
  <div className="servicios-lista">
    {servicios.map((servicio) => (
      <div key={servicio.id} className="servicio-card">
<p style={{ color: 'red' }}>

</p>
        <img
src={servicio.imagen_url ? servicio.imagen_url : (
  servicio.nombre.toLowerCase().includes('barba')
    ? '/images/barberia-junior/servicio-barba.jpg'
    : '/images/barberia-junior/servicio-corte.jpg'
)}
          alt={servicio.nombre}
        onLoad={(e) => {

}}
onError={() => console.log('ERROR AL CARGAR:', servicio.nombre, servicio.imagen_url)}
style={{
  display: 'block',
  width: '100%',
  height: '220px',
  objectFit: 'cover',
  objectPosition: 'center center',
  borderRadius: '12px'
}}
        />

        <h3>{servicio.nombre}</h3>

        <p>
          Precio: ₲ {Number(servicio.precio).toLocaleString('es-PY')}
        </p>


      </div>
    ))}
  </div>
)}

</section>
      <section style={{ padding: '30px 0' }}>
  <h2>Conocé nuestro local</h2>

  <img
src={personalizacion?.local_url || '/images/barberia-junior/local.jpg'}
alt={`Interior de ${personalizacion?.nombre_publico || negocio.nombre}`}
    style={{
      width: '100%',
      maxWidth: '800px',
      height: '400px',
      objectFit: 'cover',
      borderRadius: '15px'
    }}
  />
</section>
{personalizacion?.galeria?.length > 0 && (
  <section style={{
    padding: '40px 20px',
    textAlign: 'center'
  }}>
    <h2>Galería de fotos</h2>

    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
      gap: '20px',
      maxWidth: '1100px',
      margin: '30px auto'
    }}>
      {personalizacion.galeria.map((imagen, index) => (
        <img
          key={index}
          src={imagen}
          alt={`Foto de galería ${index + 1}`}
          style={{
            width: '100%',
            height: '250px',
            objectFit: 'cover',
            borderRadius: '12px'
          }}
        />
      ))}
    </div>
  </section>
)}
      <section>
        <h2>Horarios de atención</h2>
        <p>
          {negocio.hora_apertura?.slice(0, 5)} a{' '}
          {negocio.hora_cierre?.slice(0, 5)}
        </p>
        <p>{negocio.dias_atencion}</p>
      </section>

<section id="reservar">
  <h2>Reservá tu turno</h2>


<label className="titulo-servicios">Elegí tu servicio</label>

<div className="servicios-selector">
  {servicios.map((servicio) => (
    <div
      key={servicio.id}
      className={`servicio-opcion ${
        servicioSeleccionado === String(servicio.id)
          ? 'servicio-elegido'
          : ''
      }`}
    >
<img
  src={
    servicio.imagen_url ||
    (servicio.nombre.toLowerCase().includes('barba')
      ? '/images/barberia-junior/servicio-barba.jpg'
      : '/images/barberia-junior/servicio-corte.jpg')
  }
  alt={servicio.nombre}
  style={{
    width: '100%',
    height: '220px',
    objectFit: 'cover',
    borderRadius: '12px'
  }}
/>

      <div className="servicio-info">
        <h3>{servicio.nombre}</h3>

        <p className="servicio-precio">
          ₲ {Number(servicio.precio).toLocaleString('es-PY')}
        </p>


        <button
          type="button"
          className="boton-elegir-servicio"
          onClick={() => {
            const id = String(servicio.id)

            setServicioSeleccionado(id)
            setHoraSeleccionada('')
            setHorariosDisponibles([])

            if (fechaSeleccionada) {
              cargarHorarios(fechaSeleccionada, id)
            }
          }}
        >
          {servicioSeleccionado === String(servicio.id)
            ? '✓ SERVICIO ELEGIDO'
            : 'ELEGIR SERVICIO'}
        </button>
      </div>
    </div>
  ))}
</div>


<div className="fecha-reserva-contenedor">
  <label>Fecha</label>
  <input
    className="campo-fecha-reserva"
    type="date"
    value={fechaSeleccionada}
    min={(() => {
      const hoy = new Date()
      return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`
    })()}
    onChange={(e) => {
      setFechaSeleccionada(e.target.value)
      cargarHorarios(e.target.value, servicioSeleccionado)
    }}
  />
</div>


<label className="titulo-horarios">Elegí tu horario</label>


<div className="horarios-selector">
  {horariosDisponibles.map((hora) => {
    const seleccionado = horaSeleccionada === hora

    return (
      <button
        key={hora}
        type="button"
        className={`horario-opcion ${seleccionado ? 'horario-elegido' : ''}`}
        onClick={() => {
          setHoraSeleccionada(hora)
          setMensajeReserva('')
        }}
        style={{
          background: seleccionado ? '#d6ad62' : '#242424',
          color: seleccionado ? '#111111' : '#ffffff',
          border: seleccionado ? '2px solid #e8c982' : '1px solid #55432b',
          fontWeight: 'bold',
          cursor: 'pointer'
        }}
      >
        {seleccionado ? '✓ ' : ''}{hora}
      </button>
    )
  })}
</div>


{horariosDisponibles.length === 0 &&
  fechaSeleccionada &&
  servicioSeleccionado && (
    <p className="sin-horarios">
      No hay horarios disponibles para esta fecha.
    </p>
  )}


  <label>Tu nombre</label>
  <input
    type="text"
    placeholder="Ingresá tu nombre"
    value={clienteNombre}
    onChange={(e) => setClienteNombre(e.target.value)}
  />

  <label>Tu WhatsApp</label>
  <input
    type="tel"
    placeholder="Ingresá tu número"
    value={clienteWhatsapp}
    onChange={(e) => setClienteWhatsapp(e.target.value)}
  />

{servicioSeleccionado && fechaSeleccionada && horaSeleccionada && (
  <div className="resumen-reserva">
    <h3>RESUMEN DE TU RESERVA</h3>

    <div className="resumen-linea">
      <span>Servicio</span>
      <strong>
        {servicios.find(
          (s) => String(s.id) === String(servicioSeleccionado)
        )?.nombre}
      </strong>
    </div>

    <div className="resumen-linea">
      <span>Precio</span>
      <strong>
        ₲ {Number(
          servicios.find(
            (s) => String(s.id) === String(servicioSeleccionado)
          )?.precio || 0
        ).toLocaleString('es-PY')}
      </strong>
    </div>

    <div className="resumen-linea">
      <span>Fecha</span>
      <strong>{fechaSeleccionada.split('-').reverse().join('/')}</strong>
    </div>

    <div className="resumen-linea">
      <span>Horario</span>
      <strong>{horaSeleccionada}</strong>
    </div>
  </div>
)}

<button
  className="boton-confirmar-reserva"
  onClick={registrarReservaPublica}
  disabled={guardandoReserva}
>
    {guardandoReserva ? 'Reservando...' : 'Confirmar reserva'}
  </button>

{mensajeReserva && (
  <div className="reserva-mensaje">
    <span>✓</span>
    <div>
      <strong>
        {mensajeReserva.includes('correctamente')
          ? '¡Reserva solicitada!'
          : 'Atención'}
      </strong>
      <p>{mensajeReserva}</p>
    


{enlaceWhatsapp && (
  <div className="confirmacion-overlay">
    <div className="confirmacion-whatsapp">
      <div className="confirmacion-icono">✓</div>

      <h2>¡TURNO CONFIRMADO!</h2>

      <p>
        Tu solicitud de reserva fue registrada correctamente.
      </p>

      <a
        href={enlaceWhatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="boton-whatsapp-confirmacion"
      >
        <span>✆</span> CONFIRMAR POR WHATSAPP
      </a>

      <small>
        Tocá el botón para enviar el aviso de tu reserva.
      </small>
      <button
  type="button"
  className="boton-cerrar-confirmacion"
  onClick={() => setEnlaceWhatsapp('')}
>
  CERRAR
</button>
    </div>
  </div>
)}



    </div>
  </div>
  
)}
</section>
    </main>
  )
}

export default PaginaNegocio

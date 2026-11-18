
import './App.css'
import { useState, useEffect, useRef } from 'react'
import { supabase } from './supabase'
import PaginaNegocio from './PaginaNegocio'
import PersonalizarNegocio from './PersonalizarNegocio'




function PanelAdmin() {
  const [sesion, setSesion] = useState(null)
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [esSuperAdmin, setEsSuperAdmin] = useState(false)
  const [seccionActiva, setSeccionActiva] = useState('dashboard')
  const [periodoEstadisticas, setPeriodoEstadisticas] = useState('6meses')
  const [rolUsuario, setRolUsuario] = useState(null)
  const [cargandoRol, setCargandoRol] = useState(true)
const [cargando, setCargando] = useState(true)
const [email, setEmail] = useState('')
const [password, setPassword] = useState('')
const [passwordPropietario, setPasswordPropietario] = useState('')
  const [mostrarFormulario, setMostrarFormulario] = useState(false)
  const [negocioEditando, setNegocioEditando] = useState(null)
  const [negocios, setNegocios] = useState([])
  const [reservasRecientes, setReservasRecientes] = useState([])
  const [reservasDashboard, setReservasDashboard] = useState([])
  const [movimientosDashboard, setMovimientosDashboard] = useState([])
  const [servicios, setServicios] = useState([])
  const [reservas, setReservas] = useState([])
  const [busquedaReserva, setBusquedaReserva] = useState('')
  const [mostrarReservas, setMostrarReservas] = useState(false)
  const [mostrarCalendario, setMostrarCalendario] = useState(false)
const [fechaCalendario, setFechaCalendario] = useState('')
const [fechaFiltroCaja, setFechaFiltroCaja] = useState('');
const [fechaFiltroCierres, setFechaFiltroCierres] = useState('');
const [mostrarIngresos, setMostrarIngresos] = useState(false)
const [movimientos, setMovimientos] = useState([])
const [cierresCaja, setCierresCaja] = useState([])
const [cargandoCierre, setCargandoCierre] = useState(false)
const [mostrarFormularioIngreso, setMostrarFormularioIngreso] = useState(false)
const [mostrarFormularioGasto, setMostrarFormularioGasto] = useState(false)

const [nuevoGasto, setNuevoGasto] = useState({
  monto: '',
  metodo_pago: 'efectivo',
  descripcion: ''
})

const [nuevoIngreso, setNuevoIngreso] = useState({
  monto: '',
  metodo_pago: 'efectivo',
  descripcion: ''
})
const [mesCalendario, setMesCalendario] = useState(new Date())
  const [fechaFiltro, setFechaFiltro] = useState('')
  const [estadoFiltro, setEstadoFiltro] = useState('Todas')
  const [reservaEditando, setReservaEditando] = useState(null)

const [datosReservaEditada, setDatosReservaEditada] = useState({
  cliente_nombre: '',
  cliente_whatsapp: '',
  servicio_id: '',
  fecha: '',
  hora: ''
})
  const [servicioEditando, setServicioEditando] = useState(null)
  const formularioServiciosRef = useRef(null)
const [negocioSeleccionado, setNegocioSeleccionado] = useState(null)
const [mostrarServicios, setMostrarServicios] = useState(false)
const [nuevoServicio, setNuevoServicio] = useState({
  nombre: '',
  precio: '',
  duracion: 30
})
const [nuevoNegocio, setNuevoNegocio] = useState({
  nombre: '',
  propietario: '',
  email_propietario: '',
  whatsapp: '',
  direccion: '',
  tipo: '',
  hora_apertura: '09:00',
  hora_cierre: '18:00',
  dias_atencion: 'Lunes a Sábado'
})


const fechaHoy = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Asuncion'
}).format(new Date())

const mesActual = fechaHoy.slice(0, 7)

const cantidadReservasHoy = reservasDashboard.filter(
  (reserva) => reserva.fecha === fechaHoy
).length

const negociosActivos = negocios.filter(
  (negocio) => negocio.slug && negocio.slug.trim() !== ''
).length

const clientesUnicos = new Set(
  reservasDashboard
    .map((reserva) => (reserva.cliente_whatsapp || '').replace(/\D/g, ''))
    .filter(Boolean)
).size

const reservasYaCobradas = movimientosDashboard
  .filter(
    (movimiento) =>
      movimiento.reserva_id != null &&
      movimiento.estado !== 'anulado'
  )
  .map((movimiento) => String(movimiento.reserva_id))

const ingresosReservasMes = reservasDashboard
  .filter(
    (reserva) =>
      String(reserva.fecha).slice(0, 7) === mesActual &&
      reserva.estado === 'Confirmada' &&
      !reservasYaCobradas.includes(String(reserva.id))
  )
  .reduce(
    (total, reserva) => total + Number(reserva.servicios?.precio || 0),
    0
  )

const ingresosManualesMes = movimientosDashboard
  .filter(
    (movimiento) =>
      String(movimiento.fecha).slice(0, 7) === mesActual &&
    movimiento.estado !== 'anulado' &&
      movimiento.tipo === 'ingreso' &&
      ['manual', 'reserva'].includes(movimiento.origen)
  )
  .reduce(
    (total, movimiento) => total + Number(movimiento.monto || 0),
    0
  )

const ingresosMes = ingresosReservasMes + ingresosManualesMes
const formatoGuaranies = (monto) =>
  new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0
  }).format(monto)

const stats = [
  {
    label: 'Reservas de hoy',
    value: cantidadReservasHoy,
    icon: '▦'
  },
  {
    label: esSuperAdmin ? 'Negocios activos' : 'Mi negocio',
    value: negociosActivos,
    icon: '⌂'
  },
  {
    label: 'Clientes registrados',
    value: clientesUnicos.toLocaleString('es-PY'),
    icon: '♙'
  },
  {
    label: 'Ingresos del mes',
    value: formatoGuaranies(ingresosMes),
    icon: '₲'
  }
]


useEffect(() => {
  if (!sesion) return

  const cargarNegocios = async () => {
    let consulta = supabase
      .from('negocios')
      .select('*')
      .order('created_at', { ascending: false })

    if (!esSuperAdmin) {
      consulta = consulta.eq('propietario_id', sesion.user.id)
    }

    const { data, error } = await consulta

    if (error) {
      alert('Error al cargar negocios: ' + error.message)
      return
    }

    setNegocios(data || [])
    console.log('USUARIO ACTUAL:', sesion.user.id)
console.log('NEGOCIOS CARGADOS:', data)
  }

  cargarNegocios()
}, [sesion, esSuperAdmin])

useEffect(() => {
  const cargarReservasRecientes = async () => {
    if (!sesion) return

    let consulta = supabase
      .from('reservas')
      .select('*, servicios(nombre), negocios(nombre)')
      .order('created_at', { ascending: false })
      .limit(5)

    if (!esSuperAdmin) {
      // Propietario: solo ve las de su negocio
      if (!negocios.length) {
        setReservasRecientes([])
        return
      }
      const idsNegocios = negocios.map((n) => n.id)
      consulta = consulta.in('negocio_id', idsNegocios)
    }

    const { data, error } = await consulta

    if (error) {
      console.error('Error al cargar reservas recientes:', error.message)
      return
    }

    setReservasRecientes(data || [])
  }
  cargarReservasRecientes()
}, [sesion, negocios, esSuperAdmin])


useEffect(() => {
  const cargarMovimientosDashboard = async () => {
    if (!negocios.length) {
      setMovimientosDashboard([])
      return
    }

    const idsNegocios = negocios.map((negocio) => negocio.id)

    const { data, error } = await supabase
      .from('movimientos_caja')
.select('id, negocio_id, reserva_id, tipo, monto, origen, fecha, estado')
      .in('negocio_id', idsNegocios)

    if (error) {
      console.error('Error al cargar ingresos del panel:', error.message)
      return
    }

    setMovimientosDashboard(data || [])
    console.log('ID DE NEGOCIOS:', idsNegocios)
console.log('MOVIMIENTOS DE JOSEPH:', data)
console.log('DETALLE COMPLETO:', JSON.stringify(data, null, 2))
console.table(data)
  }

  cargarMovimientosDashboard()

  if (!negocios.length) return

  const canal = supabase
    .channel('movimientos-dashboard')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'movimientos_caja'
      },
      () => {
        cargarMovimientosDashboard()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}, [negocios])
useEffect(() => {
  const cargarReservasDashboard = async () => {
    if (!negocios.length) {
      setReservasDashboard([])
      return
    }

    const idsNegocios = negocios.map((negocio) => negocio.id)

    const { data, error } = await supabase
      .from('reservas')
      .select('id, negocio_id, cliente_whatsapp, fecha, estado, servicios(precio)')
      .in('negocio_id', idsNegocios)

    if (error) {
      console.error('Error al cargar estadísticas:', error.message)
      return
    }

    setReservasDashboard(data || [])
    console.log('RESERVAS DE JOSEPH:', data)
  }

  cargarReservasDashboard()

  if (!negocios.length) return

  const canal = supabase
    .channel('reservas-dashboard')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'reservas'
      },
      () => {
        cargarReservasDashboard()
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(canal)
  }
}, [negocios])


useEffect(() => {
  const obtenerSesion = async () => {
    const { data, error } = await supabase.auth.getSession()

    if (error) {
      console.error('Error al obtener sesión:', error.message)
    }

    setSesion(data?.session || null)
    setCargando(false)
  }

  obtenerSesion()

  const { data: listener } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setSesion(session)
      setCargando(false)
    }
  )

  return () => {
    listener.subscription.unsubscribe()
  }
}, [])


useEffect(() => {
  const verificarRol = async () => {
    setCargandoRol(true)

    if (!sesion) {
      setEsSuperAdmin(false)
      setRolUsuario(null)
      setCargandoRol(false)
      return
    }

    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', sesion.user.id)
      .maybeSingle()

    if (error) {
      console.error('Error al verificar rol:', error.message)
      setEsSuperAdmin(false)
      setRolUsuario(null)
      setCargandoRol(false)
      return
    }

    setRolUsuario(data?.role || null)
    setEsSuperAdmin(data?.role === 'super_admin')
    setCargandoRol(false)
  }

  verificarRol()
}, [sesion])


const iniciarSesion = async (e) => {
  e.preventDefault()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  })

  if (error) {
    alert('Error al iniciar sesión: ' + error.message)
    return
  }
}

const cerrarSesion = async () => {
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert('Error al cerrar sesión: ' + error.message)
  }
}

const registrarNegocio = async () => {
  if (
    !nuevoNegocio.nombre ||
    !nuevoNegocio.propietario ||
    !nuevoNegocio.email_propietario ||
    !nuevoNegocio.whatsapp ||
    !nuevoNegocio.tipo
  ) {
    alert('Completá todos los campos obligatorios')
    return
  }

  // La contraseña solo es obligatoria al crear un negocio nuevo
  if (!negocioEditando && passwordPropietario.length < 8) {
    alert('La contraseña inicial debe tener al menos 8 caracteres')
    return
  }

  let data
  let error

  if (negocioEditando) {
    const resultado = await supabase
      .from('negocios')
      .update(nuevoNegocio)
      .eq('id', negocioEditando.id)
      .select()
      .single()

    data = resultado.data
    error = resultado.error
  } else {
    const resultado = await supabase
      .from('negocios')
      .insert([{
        ...nuevoNegocio,
        propietario_id: null
      }])
      .select()
      .single()

    data = resultado.data
    error = resultado.error
  }

  if (error) {
    alert('Error al registrar: ' + error.message)
    return
  }

  // Crear la cuenta únicamente cuando se registra un negocio nuevo
  if (!negocioEditando) {
    const { data: invitacion, error: errorInvitacion } =
      await supabase.functions.invoke('crear-propietario', {
        body: {
          email: data.email_propietario,
          password: passwordPropietario,
          negocio_id: data.id
        }
      })

    if (errorInvitacion || invitacion?.error || !invitacion?.success) {
      alert(
        'El negocio se registró, pero no se pudo crear la cuenta del propietario: ' +
        (invitacion?.error || errorInvitacion?.message || 'Error desconocido')
      )
      return
    }

    // Actualizar el negocio con el propietario recién vinculado
    data = {
      ...data,
      propietario_id: invitacion.propietario_id || data.propietario_id
    }
  }

  setNegocios((anteriores) =>
    negocioEditando
      ? anteriores.map((negocio) =>
          negocio.id === data.id ? data : negocio
        )
      : [...anteriores, data]
  )

  setNuevoNegocio({
    nombre: '',
    propietario: '',
    email_propietario: '',
    whatsapp: '',
    direccion: '',
    tipo: '',
    hora_apertura: '09:00',
    hora_cierre: '18:00',
    dias_atencion: 'Lunes a Sábado'
  })

  setPasswordPropietario('')
  setMostrarFormulario(false)
  setNegocioEditando(null)

  alert(
    negocioEditando
      ? '¡Negocio actualizado correctamente!'
      : '¡Negocio y cuenta del propietario registrados correctamente!'
  )
}







const cargarServicios = async (negocio) => {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('negocio_id', negocio.id)
    .order('created_at', { ascending: false })

  if (error) {
    alert('Error al cargar servicios: ' + error.message)
    return
  }

  setServicios(data || [])
  setNegocioSeleccionado(negocio)
  setMostrarServicios(true)
}

const cargarReservas = async (negocio) => {
  const { data, error } = await supabase
    .from('reservas')
.select('*, servicios(nombre, precio, duracion)')
    .eq('negocio_id', negocio.id)
    .order('fecha', { ascending: true })

  if (error) {
    alert('Error al cargar reservas: ' + error.message)
    return
  }

  setReservas(data || [])
  setNegocioSeleccionado(negocio)
  setMostrarReservas(true)
}
const cargarTodasReservas = async () => {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, servicios(nombre, precio, duracion), negocios(nombre)')
    .order('fecha', { ascending: true })

  if (error) {
    alert('Error al cargar todas las reservas: ' + error.message)
    return
  }

  setReservas(data || [])
  setNegocioSeleccionado(null)
  setMostrarReservas(true)
  setSeccionActiva('reservas')
}
const cargarCalendario = async (negocio) => {
  const { data, error } = await supabase
    .from('reservas')
    .select('*, servicios(nombre, precio, duracion)')
    .eq('negocio_id', negocio.id)
    .order('fecha', { ascending: true })
    .order('hora', { ascending: true })

  if (error) {
    alert('Error al cargar el calendario: ' + error.message)
    return
  }

  setReservas(data || [])
  setNegocioSeleccionado(negocio)
  setMostrarServicios(false)
  setMostrarReservas(false)
  setMostrarCalendario(true)
}

const cargarIngresos = async (negocio) => {
  const { data, error } = await supabase
    .from('movimientos_caja')
    .select('*')
    .eq('negocio_id', negocio.id)
    .order('fecha', { ascending: false })

  if (error) {
    alert('Error al cargar los ingresos: ' + error.message)
    return
  }

  setMovimientos(data || [])
  await cargarCierresCaja(negocio)
  setNegocioSeleccionado(negocio)

  setMostrarCalendario(false)
  setMostrarServicios(false)
  setMostrarReservas(false)
  setMostrarFormularioIngreso(false)

  setMostrarIngresos(true)
}
const cargarCierresCaja = async (negocio) => {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .eq('negocio_id', negocio.id)
    .order('fecha', { ascending: false })

  if (error) {
    alert('Error al cargar los cierres: ' + error.message)
    return
  }

  setCierresCaja(data || [])
}
const registrarIngreso = async () => {
  const monto = Number(nuevoIngreso.monto)

  if (!negocioSeleccionado) {
    alert('No hay un negocio seleccionado.')
    return
  }

  if (!monto || monto <= 0) {
    alert('Ingresá un monto válido.')
    return
  }

  if (!nuevoIngreso.descripcion.trim()) {
    alert('Ingresá una descripción del cobro.')
    return
  }

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({
      negocio_id: negocioSeleccionado.id,
      tipo: 'ingreso',
      monto,
      metodo_pago: nuevoIngreso.metodo_pago,
      descripcion: nuevoIngreso.descripcion.trim(),
      origen: 'manual'
    })
    .select()
    .single()

  if (error) {
    alert('Error al registrar el ingreso: ' + error.message)
    return
  }

  const { error: errorAuditoria } = await supabase
    .from('auditoria')
    .insert({
      negocio_id: negocioSeleccionado.id,
      accion: 'Registro de ingreso',
      entidad: 'movimientos_caja',
      registro_id: String(data.id),
      detalle: {
        monto,
        metodo_pago: nuevoIngreso.metodo_pago,
        descripcion: nuevoIngreso.descripcion.trim()
      }
    })

  if (errorAuditoria) {
    console.error('Error al registrar auditoría:', errorAuditoria.message)
  }

  setNuevoIngreso({
    monto: '',
    metodo_pago: 'efectivo',
    descripcion: ''
  })

  setMostrarFormularioIngreso(false)

  await cargarIngresos(negocioSeleccionado)

  alert('¡Ingreso registrado correctamente!')
}
const registrarGasto = async () => {
  const monto = Number(nuevoGasto.monto)

  if (!negocioSeleccionado) {
    alert('No hay un negocio seleccionado.')
    return
  }

  if (!monto || monto <= 0) {
    alert('Ingresá un monto válido.')
    return
  }

  if (!nuevoGasto.descripcion.trim()) {
    alert('Ingresá una descripción del gasto.')
    return
  }

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({
      negocio_id: negocioSeleccionado.id,
      tipo: 'egreso',
      monto,
      metodo_pago: nuevoGasto.metodo_pago,
      descripcion: nuevoGasto.descripcion.trim(),
      origen: 'manual'
    })
    .select()
    .single()

  if (error) {
    alert('Error al registrar el gasto: ' + error.message)
    return
  }

  const { error: errorAuditoria } = await supabase
    .from('auditoria')
    .insert({
      negocio_id: negocioSeleccionado.id,
      accion: 'Registro de gasto',
      entidad: 'movimientos_caja',
      registro_id: String(data.id),
      detalle: {
        monto,
        metodo_pago: nuevoGasto.metodo_pago,
        descripcion: nuevoGasto.descripcion.trim()
      }
    })

  if (errorAuditoria) {
    console.error('Error al registrar auditoría:', errorAuditoria.message)
  }

  setNuevoGasto({
    monto: '',
    metodo_pago: 'efectivo',
    descripcion: ''
  })

  setMostrarFormularioGasto(false)

  await cargarIngresos(negocioSeleccionado)

  alert('¡Gasto registrado correctamente!')
}
const anularMovimiento = async (movimiento) => {
  if (movimiento.estado === 'anulado') {
    alert('Este movimiento ya está anulado.')
    return
  }

  const motivo = window.prompt(
    `¿Por qué querés anular este ${movimiento.tipo}?\n\nEjemplo: Registrado por error.`
  )

  if (motivo === null) return

  if (motivo.trim().length < 3) {
    alert('Escribí un motivo de al menos 3 caracteres.')
    return
  }

  const { data, error } = await supabase.rpc(
    'anular_movimiento_caja',
    {
      p_movimiento_id: movimiento.id,
      p_motivo: motivo.trim()
    }
  )

  if (error) {
    alert('No se pudo anular el movimiento: ' + error.message)
    return
  }

  await cargarIngresos(negocioSeleccionado)

  alert('Movimiento anulado correctamente.')
}
const abrirCaja = async () => {
  if (!negocioSeleccionado) {
    alert('No hay un negocio seleccionado.')
    return
  }

  const confirmar = window.confirm(
    '¿Querés activar la caja de hoy?'
  )

  if (!confirmar) return

  setCargandoCierre(true)

  const { data, error } = await supabase.rpc('abrir_caja', {
    p_negocio_id: negocioSeleccionado.id,
    p_monto_apertura: 0
  })

  setCargandoCierre(false)

  if (error) {
    alert('Error al activar la caja: ' + error.message)
    return
  }

  await cargarCierresCaja(negocioSeleccionado)

  alert('¡Caja activada correctamente!')
}
const cerrarCaja = async () => {
  if (!negocioSeleccionado) {
    alert('No hay un negocio seleccionado.')
    return
  }

  const confirmar = window.confirm(
    '¿Querés cerrar la caja de hoy? Se calcularán automáticamente todos los ingresos y gastos registrados.'
  )

  if (!confirmar) return

  setCargandoCierre(true)

  const { data, error } = await supabase.rpc('cerrar_caja', {
    p_negocio_id: negocioSeleccionado.id
  })

  setCargandoCierre(false)

  if (error) {
    alert('Error al cerrar la caja: ' + error.message)
    return
  }

  await cargarCierresCaja(negocioSeleccionado)

  alert(
    '¡Caja cerrada correctamente!\n\n' +
    'Ingresos: ' + formatoCaja(Number(data.total_ingresos)) +
    '\nGastos: ' + formatoCaja(Number(data.total_gastos)) +
    '\nSaldo final: ' + formatoCaja(Number(data.saldo_final))
  )
}
const registrarCobroReserva = async (reserva) => {
  if (reserva.estado !== 'Confirmada') {
    alert('Primero tenés que confirmar la reserva.')
    return
  }

const yaCobrado = movimientosDashboard.some(
  (movimiento) =>
    String(movimiento.reserva_id) === String(reserva.id) &&
    movimiento.estado !== 'anulado'

)

  if (yaCobrado) {
    alert('Esta reserva ya tiene un cobro registrado.')
    return
  }

  const monto = Number(reserva.servicios?.precio || 0)

  if (monto <= 0) {
    alert('Esta reserva no tiene un precio válido.')
    return
  }

  const metodo = window.prompt(
    'Método de pago: efectivo, transferencia, tarjeta u otro',
    'efectivo'
  )

  if (metodo === null) return

  const metodoPago = metodo.trim().toLowerCase()
  const metodosPermitidos = [
    'efectivo',
    'transferencia',
    'tarjeta',
    'otro'
  ]

  if (!metodosPermitidos.includes(metodoPago)) {
    alert('Método inválido. Elegí efectivo, transferencia, tarjeta u otro.')
    return
  }

  const { data, error } = await supabase
    .from('movimientos_caja')
    .insert({
      negocio_id: reserva.negocio_id,
      reserva_id: reserva.id,
      tipo: 'ingreso',
      monto,
      metodo_pago: metodoPago,
      descripcion: `Cobro de reserva #${reserva.id} - ${reserva.cliente_nombre}`,
      origen: 'reserva'
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      alert('Esta reserva ya tiene un cobro registrado.')
    } else {
      alert('Error al registrar el cobro: ' + error.message)
    }
    return
  }

  setMovimientosDashboard((anteriores) => [
    data,
    ...anteriores
  ])

  const { error: errorAuditoria } = await supabase
    .from('auditoria')
    .insert({
      negocio_id: reserva.negocio_id,
      accion: 'Cobro de reserva',
      entidad: 'movimientos_caja',
      registro_id: String(data.id),
      detalle: {
        reserva_id: reserva.id,
        monto,
        metodo_pago: metodoPago
      }
    })

  if (errorAuditoria) {
    console.error('Error al registrar auditoría:', errorAuditoria.message)
  }

  alert('¡Cobro registrado correctamente!')
}
const cambiarMes = (cantidad) => {
  setMesCalendario((mesActual) =>
    new Date(
      mesActual.getFullYear(),
      mesActual.getMonth() + cantidad,
      1
    )
  )
}

const obtenerDiasDelMes = () => {
  const año = mesCalendario.getFullYear()
  const mes = mesCalendario.getMonth()

  const primerDia = new Date(año, mes, 1).getDay()
  const cantidadDias = new Date(año, mes + 1, 0).getDate()

  const dias = []

  // Espacios antes del primer día del mes
  for (let i = 0; i < primerDia; i++) {
    dias.push(null)
  }

  // Días del mes
  for (let dia = 1; dia <= cantidadDias; dia++) {
    dias.push(dia)
  }

  return dias
}

const fechaDelDia = (dia) => {
  const año = mesCalendario.getFullYear()
  const mes = String(mesCalendario.getMonth() + 1).padStart(2, '0')
  const diaFormateado = String(dia).padStart(2, '0')

  return `${año}-${mes}-${diaFormateado}`
}


{mostrarCalendario && (
<section className="panel calendar-premium" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
        <h3>Calendario de {negocioSeleccionado?.nombre}</h3>
        <p>Consultá y organizá todas tus reservas</p>
      </div>

      <button
        className="secondary-button"
        onClick={() => setMostrarCalendario(false)}
      >
        Volver
      </button>
    </div>

    {/* Navegación del mes */}
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      margin: '25px 0',
      gap: '12px',
      flexWrap: 'wrap'
    }}>
      <h2 style={{
        textTransform: 'capitalize',
        margin: 0
      }}>
        {mesCalendario.toLocaleDateString('es-PY', {
          month: 'long',
          year: 'numeric'
        })}
      </h2>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="secondary-button"
          onClick={() => cambiarMes(-1)}
        >
          ← Anterior
        </button>

        <button
          className="secondary-button"
          onClick={() => {
            setMesCalendario(new Date())
            setFechaCalendario('')
          }}
        >
          Hoy
        </button>

        <button
          className="secondary-button"
          onClick={() => cambiarMes(1)}
        >
          Siguiente →
        </button>
      </div>
    </div>

    {/* Días de la semana */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gap: '6px',
      marginBottom: '8px'
    }}>
      {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(dia => (
<div
  key={dia}
  className="calendar-weekday"
  style={{
    textAlign: 'center',
            fontWeight: '600',
            padding: '10px 2px',
            color: '#888'
          }}
        >
          {dia}
        </div>
      ))}
    </div>

    {/* Cuadrícula del calendario */}
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
      gap: '6px'
    }}>
      {obtenerDiasDelMes().map((dia, index) => {
        if (!dia) {
          return <div key={`vacio-${index}`} />
        }

        const fecha = fechaDelDia(dia)

        const cantidad = reservas.filter(
          r => r.fecha === fecha
        ).length

        const seleccionado = fechaCalendario === fecha
const ahora = new Date()
const esHoy =
  fecha === `${ahora.getFullYear()}-${String(ahora.getMonth() + 1).padStart(2, '0')}-${String(ahora.getDate()).padStart(2, '0')}`
        return (
<button
  key={dia}
  className={`calendar-day ${seleccionado ? 'selected' : ''} ${esHoy ? 'today' : ''}`}
  onClick={() => setFechaCalendario(fecha)}
            style={{
              minHeight: '75px',
              border: seleccionado
                ? '2px solid #6366f1'
                : '1px solid #e5e7eb',
              borderRadius: '10px',
              background: seleccionado ? '#eef2ff' : '#fff',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '7px',
              color: '#222',
              padding: '5px'
            }}
          >
<strong className="calendar-day-number">{dia}</strong>

{cantidad > 0 && (
  <span className="calendar-badge">
    {cantidad} {cantidad === 1 ? 'turno' : 'turnos'}
  </span>
)}
          </button>
        )
      })}
    </div>

    {/* Reservas del día seleccionado */}
    <div style={{ marginTop: '30px' }}>
      <div className="panel-heading">
        <div>
          <h3>
            {fechaCalendario
              ? `Reservas del ${fechaCalendario}`
              : 'Todas las reservas'}
          </h3>
          <p>
            {reservas.filter(r =>
              !fechaCalendario || r.fecha === fechaCalendario
            ).length} reservas encontradas
          </p>
        </div>

        <button
          className="secondary-button"
          onClick={() => setFechaCalendario('')}
        >
          Ver todas
        </button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>FECHA</th>
              <th>HORARIO</th>
              <th>CLIENTE</th>
              <th>WHATSAPP</th>
              <th>SERVICIO</th>
              <th>ESTADO</th>
            </tr>
          </thead>

          <tbody>
            {reservas
              .filter(r =>
                !fechaCalendario || r.fecha === fechaCalendario
              )
              .map(reserva => (
                <tr key={reserva.id}>
                  <td>{reserva.fecha}</td>
                  <td>{String(reserva.hora).slice(0, 5)}</td>
                  <td>
                    <strong>{reserva.cliente_nombre}</strong>
                  </td>
                  <td>{reserva.cliente_whatsapp}</td>
                  <td>{reserva.servicios?.nombre || 'Sin servicio'}</td>
                  <td>{reserva.estado}</td>
                </tr>
              ))}

            {reservas.filter(r =>
              !fechaCalendario || r.fecha === fechaCalendario
            ).length === 0 && (
              <tr>
                <td colSpan="6">
                  No hay reservas para esta fecha.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
)}


const actualizarEstadoReserva = async (reserva, nuevoEstado) => {
  const { data, error } = await supabase
    .from('reservas')
    .update({ estado: nuevoEstado })
    .eq('id', reserva.id)
    .select()
    .single()

  if (error) {
    alert('Error al actualizar reserva: ' + error.message)
    return
  }

  setReservas((anteriores) =>
    anteriores.map((r) =>
      r.id === data.id
        ? { ...r, ...data, servicios: r.servicios }
        : r
    )
  )
}
const eliminarReserva = async (id) => {
  const confirmar = window.confirm(
    '¿Estás seguro de que querés eliminar esta reserva?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('reservas')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Error al eliminar reserva: ' + error.message)
    return
  }

  setReservas((anteriores) =>
    anteriores.filter((reserva) => reserva.id !== id)
  )

  alert('Reserva eliminada correctamente')
}

const prepararEdicionReserva = async (reserva) => {
  const { data, error } = await supabase
    .from('servicios')
    .select('*')
    .eq('negocio_id', reserva.negocio_id)

  if (error) {
    alert('Error al cargar servicios: ' + error.message)
    return
  }

  setServicios(data || [])
  setReservaEditando(reserva)

  setDatosReservaEditada({
    cliente_nombre: reserva.cliente_nombre,
    cliente_whatsapp: reserva.cliente_whatsapp,
    servicio_id: String(reserva.servicio_id),
    fecha: reserva.fecha,
    hora: reserva.hora
  })
}

const guardarEdicionReserva = async () => {
  if (
    !datosReservaEditada.cliente_nombre ||
    !datosReservaEditada.cliente_whatsapp ||
    !datosReservaEditada.servicio_id ||
    !datosReservaEditada.fecha ||
    !datosReservaEditada.hora
  ) {
    alert('Completá todos los campos')
    return
  }

  const { data, error } = await supabase
    .from('reservas')
    .update({
      cliente_nombre: datosReservaEditada.cliente_nombre,
      cliente_whatsapp: datosReservaEditada.cliente_whatsapp,
      servicio_id: Number(datosReservaEditada.servicio_id),
      fecha: datosReservaEditada.fecha,
      hora: datosReservaEditada.hora
    })
    .eq('id', reservaEditando.id)
    .select('*, servicios(nombre, precio, duracion)')
    .single()

  if (error) {
    alert('Error al actualizar reserva: ' + error.message)
    return
  }

  setReservas((anteriores) =>
    anteriores.map((reserva) =>
      reserva.id === data.id ? data : reserva
    )
  )

  setReservaEditando(null)

  alert('¡Reserva actualizada correctamente!')
}
const registrarServicio = async () => {
  if (!nuevoServicio.nombre || !nuevoServicio.precio) {
    alert('Completá el nombre y el precio del servicio')
    return
  }

  let data
  let error

  if (servicioEditando) {
    const resultado = await supabase
      .from('servicios')
      .update({
        nombre: nuevoServicio.nombre,
        precio: Number(nuevoServicio.precio),
        duracion: Number(nuevoServicio.duracion)
      })
      .eq('id', servicioEditando.id)
      .select()
      .single()

    data = resultado.data
    error = resultado.error
  } else {
    const resultado = await supabase
      .from('servicios')
      .insert([{
        negocio_id: negocioSeleccionado.id,
        nombre: nuevoServicio.nombre,
        precio: Number(nuevoServicio.precio),
        duracion: Number(nuevoServicio.duracion)
      }])
      .select()
      .single()

    data = resultado.data
    error = resultado.error
  }

  if (error) {
    alert('Error al guardar servicio: ' + error.message)
    return
  }

  setServicios((anteriores) =>
    servicioEditando
      ? anteriores.map((servicio) =>
          servicio.id === data.id ? data : servicio
        )
      : [data, ...anteriores]
  )

  setNuevoServicio({
    nombre: '',
    precio: '',
    duracion: 30
  })

  const estabaEditando = Boolean(servicioEditando)
  setServicioEditando(null)

  alert(
    estabaEditando
      ? '¡Servicio actualizado correctamente!'
      : '¡Servicio registrado correctamente!'
  )
}

const eliminarServicio = async (id) => {
  const confirmar = window.confirm(
    '¿Estás seguro de que querés eliminar este servicio?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('servicios')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Error al eliminar servicio: ' + error.message)
    return
  }

  setServicios((anteriores) =>
    anteriores.filter((servicio) => servicio.id !== id)
  )

  alert('Servicio eliminado correctamente')
}

const prepararEdicionServicio = (servicio) => {
  setServicioEditando(servicio)

  setNuevoServicio({
    nombre: servicio.nombre,
    precio: String(servicio.precio),
    duracion: String(servicio.duracion)
  })

  setTimeout(() => {
    formularioServiciosRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    })
  }, 100)
}
const prepararEdicion = (negocio) => {
  setNegocioEditando(negocio)

setNuevoNegocio({
  nombre: negocio.nombre,
  propietario: negocio.propietario,
  email_propietario: negocio.email_propietario || '',
  whatsapp: negocio.whatsapp,
  direccion: negocio.direccion || '',
  tipo: negocio.tipo,
  hora_apertura: negocio.hora_apertura?.slice(0, 5) || '09:00',
  hora_cierre: negocio.hora_cierre?.slice(0, 5) || '18:00',
  dias_atencion: negocio.dias_atencion || 'Lunes a Sábado'
})

  setMostrarFormulario(true)
}

const eliminarNegocio = async (id) => {
  const confirmar = window.confirm(
    '¿Estás seguro de que querés eliminar este negocio?'
  )

  if (!confirmar) return

  const { error } = await supabase
    .from('negocios')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Error al eliminar: ' + error.message)
    return
  }

  setNegocios((anteriores) =>
    anteriores.filter((negocio) => negocio.id !== id)
  )

  alert('Negocio eliminado correctamente')
}

const reservasFiltradas = reservas.filter((reserva) => {
  const coincideFecha = !fechaFiltro || reserva.fecha === fechaFiltro
  const coincideEstado = estadoFiltro === 'Todas' || reserva.estado === estadoFiltro

  const busqueda = busquedaReserva.trim().toLowerCase()

  const coincideBusqueda =
    !busqueda ||
    String(reserva.id).includes(busqueda.replace('#', '')) ||
    (reserva.cliente_nombre || '').toLowerCase().includes(busqueda) ||
    (reserva.cliente_whatsapp || '').toLowerCase().includes(busqueda)

  return coincideFecha && coincideEstado && coincideBusqueda
})

const totalReservas = reservasFiltradas.length

const reservasConfirmadas = reservasFiltradas.filter(
  (reserva) => reserva.estado === 'Confirmada'
).length

const ingresosConfirmados = reservasFiltradas
  .filter((reserva) => reserva.estado === 'Confirmada')
  .reduce(
    (total, reserva) =>
      total + Number(reserva.servicios?.precio || 0),
    0
  )

const fechaCajaHoy = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Asuncion'
}).format(new Date())

const mesCajaActual = fechaCajaHoy.slice(0, 7)

const obtenerFechaCaja = (fecha) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion'
  }).format(new Date(fecha))

const movimientosActivos = movimientos.filter(
  (m) => m.estado !== 'anulado'
)

const movimientosHoy = movimientosActivos.filter(
  (m) => obtenerFechaCaja(m.fecha) === fechaCajaHoy
)

const movimientosMes = movimientosActivos.filter(
  (m) => obtenerFechaCaja(m.fecha).slice(0, 7) === mesCajaActual
)

const sumarMovimientos = (lista, tipo) =>
  lista
    .filter((m) => m.tipo === tipo)
    .reduce((total, m) => total + Number(m.monto || 0), 0)

const ingresosHoy = sumarMovimientos(movimientosHoy, 'ingreso')
const gastosHoy = sumarMovimientos(movimientosHoy, 'egreso')
const balanceHoy = ingresosHoy - gastosHoy

const ingresosMesCaja = sumarMovimientos(movimientosMes, 'ingreso')
const gastosMesCaja = sumarMovimientos(movimientosMes, 'egreso')
const balanceMesCaja = ingresosMesCaja - gastosMesCaja

const fechaFinEstadisticas = new Date()
fechaFinEstadisticas.setHours(23, 59, 59, 999)

const fechaInicioEstadisticas = new Date()
fechaInicioEstadisticas.setHours(0, 0, 0, 0)

if (periodoEstadisticas === '7dias') {
  fechaInicioEstadisticas.setDate(
    fechaInicioEstadisticas.getDate() - 6
  )
} else if (periodoEstadisticas === '30dias') {
  fechaInicioEstadisticas.setDate(
    fechaInicioEstadisticas.getDate() - 29
  )
} else {
  fechaInicioEstadisticas.setMonth(
    fechaInicioEstadisticas.getMonth() - 5
  )
  fechaInicioEstadisticas.setDate(1)
}

const reservasDelPeriodo = reservas.filter(reserva => {
  if (!reserva.fecha || reserva.estado === 'Cancelada') {
    return false
  }

  const fechaReserva = new Date(
    `${reserva.fecha}T12:00:00`
  )

  return (
    fechaReserva >= fechaInicioEstadisticas &&
    fechaReserva <= fechaFinEstadisticas
  )
})

const movimientosDelPeriodo = movimientosActivos.filter(movimiento => {
  if (!movimiento.fecha) return false

  const fechaMovimiento = new Date(movimiento.fecha)

  return (
    fechaMovimiento >= fechaInicioEstadisticas &&
    fechaMovimiento <= fechaFinEstadisticas
  )
})

const rankingDias = (() => {
  const nombresDias = [
    'Domingo',
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado'
  ]

  const conteo = {}

  reservasDelPeriodo.forEach(reserva => {
    if (reserva.estado === 'Cancelada' || !reserva.fecha) {
      return
    }

    const dia = new Date(`${reserva.fecha}T12:00:00`).getDay()
    const nombre = nombresDias[dia]

    conteo[nombre] = (conteo[nombre] || 0) + 1
  })

  return Object.entries(conteo)
    .map(([nombre, cantidad]) => ({ nombre, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
})()


const rankingHorarios = (() => {
  const conteo = {}

  reservasDelPeriodo.forEach(reserva => {
    if (reserva.estado === 'Cancelada' || !reserva.hora) {
      return
    }

    const hora = String(reserva.hora).slice(0, 5)
    conteo[hora] = (conteo[hora] || 0) + 1
  })

  return Object.entries(conteo)
    .map(([hora, cantidad]) => ({ hora, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad)
    .slice(0, 5)
})()

const rankingServicios = Object.values(
reservasDelPeriodo.reduce((acumulado, reserva) => {
    const nombreServicio = reserva.servicios?.nombre

    if (!nombreServicio || reserva.estado === 'Cancelada') {
      return acumulado
    }

    if (!acumulado[nombreServicio]) {
      acumulado[nombreServicio] = {
        nombre: nombreServicio,
        cantidad: 0
      }
    }

    acumulado[nombreServicio].cantidad += 1

    return acumulado
  }, {})
)
  .sort((a, b) => b.cantidad - a.cantidad)
  .slice(0, 5)



const estadisticasGrafico = (() => {
  const grupos = []

  if (periodoEstadisticas === '7dias') {
    for (let i = 0; i < 7; i++) {
      const fecha = new Date(fechaInicioEstadisticas)
      fecha.setDate(fecha.getDate() + i)

      grupos.push({
        clave: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`,
        mes: fecha.toLocaleDateString('es-PY', {
          weekday: 'short',
          day: 'numeric'
        }),
        ingresos: 0,
        gastos: 0
      })
    }
  } else if (periodoEstadisticas === '30dias') {
    for (let i = 0; i < 5; i++) {
      grupos.push({
        clave: i,
        mes: `Semana ${i + 1}`,
        ingresos: 0,
        gastos: 0
      })
    }
  } else {
    for (let i = 0; i < 6; i++) {
      const fecha = new Date(
        fechaInicioEstadisticas.getFullYear(),
        fechaInicioEstadisticas.getMonth() + i,
        1
      )

      grupos.push({
        clave: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
        mes: fecha.toLocaleDateString('es-PY', {
          month: 'short'
        }),
        ingresos: 0,
        gastos: 0
      })
    }
  }

  movimientosDelPeriodo.forEach(movimiento => {
    const fechaTexto = obtenerFechaCaja(movimiento.fecha)
    const [año, mes, dia] = fechaTexto.split('-').map(Number)

    let grupo

    if (periodoEstadisticas === '7dias') {
      grupo = grupos.find(g => g.clave === fechaTexto)
    } else if (periodoEstadisticas === '30dias') {
      const fechaMovimiento = new Date(año, mes - 1, dia)
      const diferencia = Math.floor(
        (fechaMovimiento - fechaInicioEstadisticas) / 86400000
      )

      grupo = grupos[Math.floor(diferencia / 7)]
    } else {
      grupo = grupos.find(
        g => g.clave === `${año}-${String(mes).padStart(2, '0')}`
      )
    }

    if (!grupo) return

    if (movimiento.tipo === 'ingreso') {
      grupo.ingresos += Number(movimiento.monto || 0)
    }

    if (movimiento.tipo === 'egreso') {
      grupo.gastos += Number(movimiento.monto || 0)
    }
  })

  return grupos
})()



const formatoCaja = (monto) =>
  new Intl.NumberFormat('es-PY', {
    style: 'currency',
    currency: 'PYG',
    maximumFractionDigits: 0
  }).format(monto)
const fechaActualCaja = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Asuncion'
}).format(new Date())

// Detectar si existe una caja abierta
const cajaActiva = cierresCaja.find(
  (caja) => caja.estado === 'abierta'
) || null

// Buscar el último cierre de hoy, solamente si no hay caja activa
const cierreDeHoy = cajaActiva
  ? null
  : cierresCaja
      .filter(
        (caja) =>
          caja.fecha === fechaActualCaja &&
          caja.estado === 'cerrada'
      )
      .sort(
        (a, b) =>
          new Date(b.abierto_at) - new Date(a.abierto_at)
      )[0] || null
  if (cargando || (sesion && cargandoRol)) {
  return <div className="app">Verificando acceso a VERZIX...</div>
}

if (sesion && rolUsuario !== 'super_admin' && rolUsuario !== 'owner') {
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>VERZIX</h1>
        <p>Tu cuenta no tiene permisos para acceder al panel.</p>
        <button className="primary-button" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

if (!sesion) {
  return (
    <div className="login-screen">
      <div className="login-card">
        <h1>VERZIX</h1>
        <p>Ingresá a tu panel de administración</p>

        <form onSubmit={iniciarSesion}>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="primary-button">
            Iniciar sesión
          </button>
        </form>
      </div>
    </div>
  )
}

return (
    <div className="app">
{mostrarFormulario && (
  <div className="modal-overlay">
    <div className="modal">
<h2>{negocioEditando ? 'Editar negocio' : 'Agregar nuevo negocio'}</h2>
      <p>Completá los datos para registrar tu negocio en VERZIX.</p>

      <input
        type="text"
        placeholder="Nombre del negocio"
        value={nuevoNegocio.nombre}
        onChange={(e) => setNuevoNegocio({ ...nuevoNegocio, nombre: e.target.value })}
      />

      <input
        type="text"
        placeholder="Nombre del propietario"
        value={nuevoNegocio.propietario}
        onChange={(e) => setNuevoNegocio({ ...nuevoNegocio, propietario: e.target.value })}
      />
<input
  type="email"
  placeholder="Correo electrónico del propietario"
  value={nuevoNegocio.email_propietario || ''}
  onChange={(e) =>
    setNuevoNegocio({
      ...nuevoNegocio,
      email_propietario: e.target.value
    })
  }
/>
      <input
        type="tel"
        placeholder="Número de WhatsApp"
        value={nuevoNegocio.whatsapp}
        onChange={(e) => setNuevoNegocio({ ...nuevoNegocio, whatsapp: e.target.value })}
      />

      <input
        type="text"
        placeholder="Dirección del negocio"
        value={nuevoNegocio.direccion}
        onChange={(e) => setNuevoNegocio({ ...nuevoNegocio, direccion: e.target.value })}
      />

      <select
        value={nuevoNegocio.tipo}
        onChange={(e) => setNuevoNegocio({ ...nuevoNegocio, tipo: e.target.value })}
      >
        <option value="">Tipo de negocio</option>
        <option value="Barbería">Barbería</option>
        <option value="Manicura">Manicura</option>
        <option value="Salón de belleza">Salón de belleza</option>
        <option value="Otro">Otro</option>
      </select>
<label>Hora de apertura</label>
<input
  type="time"
  value={nuevoNegocio.hora_apertura}
  onChange={(e) =>
    setNuevoNegocio({
      ...nuevoNegocio,
      hora_apertura: e.target.value
    })
  }
/>

<label>Hora de cierre</label>
<input
  type="time"
  value={nuevoNegocio.hora_cierre}
  onChange={(e) =>
    setNuevoNegocio({
      ...nuevoNegocio,
      hora_cierre: e.target.value
    })
  }
/>

<label>Días de atención</label>
<input
  type="text"
  placeholder="Ej: Lunes a Sábado"
  value={nuevoNegocio.dias_atencion}
  onChange={(e) =>
    setNuevoNegocio({
      ...nuevoNegocio,
      dias_atencion: e.target.value
    })
  }
/>
{!negocioEditando && (
  <input
    type="password"
    placeholder="Contraseña inicial del propietario (mínimo 8 caracteres)"
    value={passwordPropietario}
    onChange={(e) => setPasswordPropietario(e.target.value)}
    autoComplete="new-password"
  />
)}
      <div className="modal-buttons">
        <button
          className="cancel-button"
          onClick={() => setMostrarFormulario(false)}
        >
          Cancelar
        </button>

        <button
          className="primary-button"
          onClick={registrarNegocio}
        >
{negocioEditando ? 'Guardar cambios' : 'Registrar negocio'}
        </button>
      </div>
    </div>
  </div>
)}
<aside
  className={`sidebar ${menuMovilAbierto ? 'sidebar-open' : ''}`}
  onClick={(e) => {
    if (e.target.closest('.nav-item')) {
      setMenuMovilAbierto(false)
    }
  }}
>
        <div className="brand">
<img
  src="/src/assets/verzix-logo.png"
  alt="VERZIX"
  className="brand-logo"
/>
<div>
  <h1>VERZIX</h1>
  <span>BOOKING PLATFORM</span>
</div>
</div>
       


<div className="menu-label">MENÚ PRINCIPAL</div>

<nav>
  <a
    href="#"
    className={`nav-item ${seccionActiva === 'dashboard' ? 'active' : ''}`}
    onClick={(e) => {
      e.preventDefault()
      setSeccionActiva('dashboard')
    }}
  >
    <span>⌂</span> Inicio
  </a>

  {esSuperAdmin ? (
    <>
      <a
        href="#"
        className={`nav-item ${seccionActiva === 'negocios' ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          setSeccionActiva('negocios')
        }}
      >
        <span>▣</span> Negocios
      </a>

<a
  href="#"
  className={`nav-item ${seccionActiva === 'ingresos' ? 'active' : ''}`}
  onClick={(e) => {
    e.preventDefault()
    setSeccionActiva('ingresos')

    if (negocios[0]) {
      cargarIngresos(negocios[0])
    } else {
      alert('Todavía no tenés un negocio asignado.')
    }
  }}
>
  <span>₲</span> Ingresos
</a>

      <a
        href="#"
        className={`nav-item ${seccionActiva === 'propietarios' ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          setSeccionActiva('propietarios')
        }}
      >
        <span>♙</span> Propietarios
      </a>

<a
  href="#"
  className={`nav-item ${seccionActiva === 'reservas' ? 'active' : ''}`}
  onClick={(e) => {
    e.preventDefault()
    setSeccionActiva('reservas')

    if (negocios[0]) {
      cargarReservas(negocios[0])
    } else {
      alert('Todavía no tenés negocios registrados.')
    }
  }}
>
  <span>▤</span> Reservas
</a>
    </>
  ) : (
    <>
      <a
        href="#"
        className={`nav-item ${seccionActiva === 'reservas' ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          setSeccionActiva('reservas')

          if (negocios[0]) {
            cargarReservas(negocios[0])
          } else {
            alert('Todavía no tenés un negocio asignado.')
          }
        }}
      >
        <span>▤</span> Mis reservas
      </a>

      <a
        href="#"
        className={`nav-item ${seccionActiva === 'servicios' ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          setSeccionActiva('servicios')

          if (negocios[0]) {
            cargarServicios(negocios[0])
          } else {
            alert('Todavía no tenés un negocio asignado.')
          }
        }}
      >
        <span>✂</span> Mis servicios
      </a>
      <a
        href="#"
        className={`nav-item ${seccionActiva === 'ingresos' ? 'active' : ''}`}
        onClick={(e) => {
          e.preventDefault()
          setSeccionActiva('ingresos')

          if (negocios[0]) {
            cargarIngresos(negocios[0])
          } else {
            alert('Todavía no tenés un negocio asignado.')
          }
        }}
      >
        <span>₲</span> Ingresos
      </a>
      <a
        href="#"
        className={`nav-item ${seccionActiva === 'calendario' ? 'active' : ''}`}
onClick={(e) => {
  e.preventDefault()
  setSeccionActiva('calendario')

  if (negocios[0]) {
    cargarCalendario(negocios[0])
  } else {
    alert('Todavía no tenés un negocio asignado.')
  }
}}
      >
        <span>◷</span> Calendario
      </a>
    </>
  )}
</nav>

<div className="menu-label management">GESTIÓN</div>

<nav>
<a
  href="#"
  className={`nav-item ${seccionActiva === 'estadisticas' ? 'active' : ''}`}
  onClick={(e) => {
    e.preventDefault()
    setSeccionActiva('estadisticas')

    if (negocios[0]) {
      cargarReservas(negocios[0])
      cargarIngresos(negocios[0])
    } else {
      alert('Todavía no tenés negocios registrados.')
    }
  }}
>
  <span>♧</span> Estadísticas
</a>

<a
  href="#"
  className={`nav-item ${seccionActiva === 'personalizar' ? 'active' : ''}`}
  onClick={(e) => {
    e.preventDefault()
    setSeccionActiva('personalizar')
  }}
>
  <span>✦</span> Personalizar página
</a>

  {esSuperAdmin ? (
    <a
      href="#"
      className={`nav-item ${seccionActiva === 'configuracion' ? 'active' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        setSeccionActiva('configuracion')
      }}
    >
      <span>⚙</span> Configuración general
    </a>
  ) : (
    <a
      href="#"
      className={`nav-item ${seccionActiva === 'negocio' ? 'active' : ''}`}
      onClick={(e) => {
        e.preventDefault()
        setSeccionActiva('negocio')
      }}
    >
      <span>⚙</span> Mi negocio
    </a>
  )}
</nav>

        <div className="sidebar-bottom">
          <div className="profile-avatar">EG</div>
          <div className="profile-info">
<strong>{esSuperAdmin ? 'Administrador' : 'Propietario'}</strong>
<span>{esSuperAdmin ? 'Super Admin' : 'Dueño del negocio'}</span>
          </div>
          <span className="profile-dots">•••</span>
          <button
  className="secondary-button"
  onClick={cerrarSesion}
  style={{ marginTop: '12px', width: '100%' }}
>
  Cerrar sesión
</button>
        </div>
      </aside>
      {menuMovilAbierto && (
  <button
    className="sidebar-overlay"
    onClick={() => setMenuMovilAbierto(false)}
    aria-label="Cerrar menú"
  />
)}

      <main className="main">
        <header className="topbar">
          <button
  className="mobile-menu-button"
  onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
>
  ☰
</button>
          <div className="breadcrumb">VERZIX <span>/</span> Dashboard</div>
          <div className="top-actions">
            <button className="icon-button">⌕</button>
            <button className="icon-button notification">♧<i /></button>
            <div className="top-avatar">EG</div>
          </div>
        </header>

        <section className="content">
         
          {seccionActiva === 'dashboard' && (
  <>
          
          <div className="welcome">
<div>
  <div className="eyebrow">
    {esSuperAdmin ? 'PANEL DE ADMINISTRACIÓN' : 'PANEL DE TU NEGOCIO'}
  </div>

  <h2>
    {esSuperAdmin
      ? '¡Bienvenido a VERZIX!'
      : `¡Bienvenido, ${negocios[0]?.propietario || 'propietario'}!`}
    <span> ✦</span>
  </h2>

  <p>
    {esSuperAdmin
      ? 'Este es el resumen general de tu plataforma.'
      : `Aquí podés administrar ${negocios[0]?.nombre || 'tu negocio'}, tus reservas y servicios.`}
  </p>
</div>
{esSuperAdmin && (
  <button
    className="primary-button"
    onClick={() => setMostrarFormulario(true)}
  >
    ＋ Agregar negocio
  </button>
)}
</div>

<div className="stats-grid">
            {stats.map((stat) => (
              <div className="stat-card" key={stat.label}>
                <div className="stat-top">
                  <span>{stat.label}</span>
                  <div className="stat-icon">{stat.icon}</div>
                </div>
                <h3>{stat.value}</h3>
           <div className="stat-bottom">
  <span>Datos reales de VERZIX</span>
</div>
              </div>
            ))}
          </div>

          <section className="panel" style={{ marginBottom: '24px' }}>
            <div className="panel-heading">
              <div>
<h3>{esSuperAdmin ? 'Negocios registrados' : 'Mi negocio'}</h3>

<p>
  {esSuperAdmin
    ? 'Negocios que forman parte de VERZIX'
    : 'Información y administración de tu negocio'}
</p>
              </div>
              <strong>{negocios.length} negocios</strong>
            </div>

            {negocios.length === 0 ? (
              <p>Todavía no hay negocios registrados.</p>
            ) : (
<>
<div className="tabla-negocios-desktop table-wrap">
  <table>
    <thead>
      <tr>
        <th>NEGOCIO</th>
        <th>PROPIETARIO</th>
        <th>WHATSAPP</th>
        <th>DIRECCIÓN</th>
        <th>TIPO</th>
        <th>ACCIONES</th>
      </tr>
    </thead>
    <tbody>
      {negocios.map((negocio) => (
        <tr key={negocio.id}>
          <td><strong>{negocio.nombre}</strong></td>
          <td>{negocio.propietario}</td>
          <td>{negocio.whatsapp}</td>
          <td>{negocio.direccion || 'No especificada'}</td>
          <td>{negocio.tipo}</td>
          <td>
            {esSuperAdmin && (
              <>
                <button className="secondary-button" onClick={() => prepararEdicion(negocio)}>Editar</button>
                <button className="secondary-button" onClick={() => {
                  setSeccionActiva('servicios')
                  cargarServicios(negocio)
                }}>Servicios</button>
                <button className="secondary-button" onClick={() => cargarReservas(negocio)}>Reservas</button>
                <button className="secondary-button" onClick={() => eliminarNegocio(negocio.id)} style={{ color: '#ff5555', marginLeft: '8px' }}>Eliminar</button>
              </>
            )}

            {!esSuperAdmin && (
              <>
                <button className="secondary-button" onClick={() => {
                  setSeccionActiva('servicios')
                  cargarServicios(negocio)
                }}>Mis servicios</button>
                <button className="secondary-button" onClick={() => {
                  setSeccionActiva('reservas')
                  cargarReservas(negocio)
                }}>Mis reservas</button>
              </>
            )}
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div className="negocios-mobile-cards">
  {negocios.map((negocio) => (
    <div className="negocio-mobile-card" key={negocio.id}>
      <h3>{negocio.nombre}</h3>
      <p><strong>Propietario:</strong> {negocio.propietario}</p>
      <p><strong>WhatsApp:</strong> {negocio.whatsapp}</p>
      <p><strong>Dirección:</strong> {negocio.direccion || 'No especificada'}</p>
      <p><strong>Tipo:</strong> {negocio.tipo}</p>

      <div className="negocio-mobile-actions">
        {esSuperAdmin && (
          <>
            <button className="secondary-button" onClick={() => prepararEdicion(negocio)}>Editar</button>
            <button className="secondary-button" onClick={() => {
              setSeccionActiva('servicios')
              cargarServicios(negocio)
            }}>Servicios</button>
            <button className="secondary-button" onClick={() => cargarReservas(negocio)}>Reservas</button>
            <button className="secondary-button" onClick={() => eliminarNegocio(negocio.id)} style={{ color: '#ff5555' }}>Eliminar</button>
          </>
        )}

        {!esSuperAdmin && (
          <>
            <button className="secondary-button" onClick={() => {
              setSeccionActiva('servicios')
              cargarServicios(negocio)
            }}>Mis servicios</button>
            <button className="secondary-button" onClick={() => {
              setSeccionActiva('reservas')
              cargarReservas(negocio)
            }}>Mis reservas</button>
          </>
        )}
      </div>
    </div>
  ))}
</div>
</>
            )}
          </section>

          <div className="dashboard-grid">
            <section className="panel appointments-panel">
              <div className="panel-heading">
                <div>
                  <h3>Reservas recientes</h3>
                  <p>Últimos movimientos de la plataforma</p>
                </div>
                <button
  className="secondary-button"
  onClick={cargarTodasReservas}
>
  Ver todas ↗
</button>
              </div>


<div className="reservas-recientes-desktop table-wrap">
  <table>
    <thead>
      <tr>
        <th>CLIENTE</th>
        <th>NEGOCIO</th>
        <th>HORARIO</th>
        <th>ESTADO</th>
      </tr>
    </thead>
    <tbody>
      {reservasRecientes.map((reserva) => (
        <tr key={reserva.id}>
          <td>
            <strong>{reserva.cliente_nombre}</strong>
            <small>{reserva.servicios?.nombre || 'Sin servicio'}</small>
          </td>
          <td>{reserva.negocios?.nombre || 'Sin negocio'}</td>
          <td>{String(reserva.hora).slice(0, 5)}</td>
          <td>
            <span className={`status ${
              reserva.estado === 'Confirmada' ? 'confirmed' : 'pending'
            }`}>
              {reserva.estado}
            </span>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

<div className="reservas-recientes-mobile">
  {reservasRecientes.map((reserva) => (
    <div className="reserva-reciente-card" key={reserva.id}>
      <h4>{reserva.cliente_nombre}</h4>
      <p><strong>Servicio:</strong> {reserva.servicios?.nombre || 'Sin servicio'}</p>
      <p><strong>Negocio:</strong> {reserva.negocios?.nombre || 'Sin negocio'}</p>
      <p><strong>Horario:</strong> {String(reserva.hora).slice(0, 5)}</p>
      <p>
        <strong>Estado:</strong>{' '}
        <span className={`status ${
          reserva.estado === 'Confirmada' ? 'confirmed' : 'pending'
        }`}>
          {reserva.estado}
        </span>
      </p>
    </div>
  ))}
</div>

            </section>

            <section className="panel activity-panel">
              <div className="panel-heading">
                <div>
                  <h3>Actividad</h3>
                  <p>Resumen de la plataforma</p>
                </div>
              </div>
              <div className="activity-item">
                <div className="activity-icon green">✓</div>
                <div><strong>Plataforma activa</strong><span>Todos los sistemas funcionando</span></div>
              </div>
<div className="activity-item">
  <div className="activity-icon blue">＋</div>
  <div>
    <strong>
      {negocios.length} {esSuperAdmin ? 'negocios' : 'negocio'}
    </strong>
    <span>
      {esSuperAdmin ? 'Registrados en VERZIX' : 'Vinculado a tu cuenta'}
    </span>
  </div>
</div>

<div className="activity-item">
  <div className="activity-icon purple">▦</div>
  <div>
    <strong>{cantidadReservasHoy} reservas</strong>
    <span>Registradas hoy</span>
  </div>
</div>
              <div className="platform-status">
                <span className="status-dot"></span>
                Sistema operativo
              </div>
            </section>
          </div>

              </>
  )}
{seccionActiva === 'ingresos' && (
  <section className="panel income-section" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
        <h3>Caja de {negocioSeleccionado?.nombre}</h3>
        <p>Control de ingresos, gastos y balance del negocio</p>
      </div>

      <button
        className="secondary-button"
onClick={() => setSeccionActiva('dashboard')}
      >
        Volver
      </button>
    </div>
<div className="seccion-cierre-caja">


<h2>CAJA</h2>

{cajaActiva ? (
  <div>
    <button
      onClick={cerrarCaja}
      disabled={cargandoCierre}
      style={{
        background: '#16a34a',
        color: '#ffffff',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: cargandoCierre ? 'wait' : 'pointer',
        opacity: cargandoCierre ? 0.7 : 1
      }}
    >
      {cargandoCierre ? 'Cerrando caja...' : 'Cerrar caja'}
    </button>
  </div>
) : (
  <div>
    <p style={{
      color: '#ef4444',
      fontWeight: '600',
      marginTop: '12px'
    }}>
      La caja de hoy fue cerrada.
    </p>

    <button
      onClick={abrirCaja}
      disabled={cargandoCierre}
      style={{
        background: '#ef4444',
        color: '#ffffff',
        border: 'none',
        padding: '12px 20px',
        borderRadius: '8px',
        fontWeight: '600',
        cursor: cargandoCierre ? 'wait' : 'pointer',
        opacity: cargandoCierre ? 0.7 : 1
      }}
    >
      {cargandoCierre ? 'Activando caja...' : 'Activar caja'}
    </button>
  </div>
)}


</div>
    {/* RESUMEN DEL DÍA */}
    <h3 style={{ marginTop: '28px' }}>Resumen de hoy</h3>

    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-top">
          <span>Ingresos del día</span>
        </div>
        <h3 style={{ color: '#22c55e' }}>
          {formatoCaja(ingresosHoy)}
        </h3>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Gastos del día</span>
        </div>
        <h3 style={{ color: '#ef4444' }}>
          {formatoCaja(gastosHoy)}
        </h3>
      </div>

      <div className="stat-card">
        <div className="stat-top">
          <span>Balance del día</span>
        </div>
        <h3 style={{ color: balanceHoy >= 0 ? '#22c55e' : '#ef4444' }}>
          {formatoCaja(balanceHoy)}
        </h3>
      </div>
    </div>

    {/* RESUMEN DEL MES */}
    <h3 style={{ marginTop: '28px' }}>Resumen del mes</h3>

    <div className="stats-grid">
      <div className="stat-card">
        <span>Ingresos del mes</span>
        <h3 style={{ color: '#22c55e' }}>
          {formatoCaja(ingresosMesCaja)}
        </h3>
      </div>

      <div className="stat-card">
        <span>Gastos del mes</span>
        <h3 style={{ color: '#ef4444' }}>
          {formatoCaja(gastosMesCaja)}
        </h3>
      </div>

      <div className="stat-card">
        <span>Balance del mes</span>
        <h3 style={{ color: balanceMesCaja >= 0 ? '#22c55e' : '#ef4444' }}>
          {formatoCaja(balanceMesCaja)}
        </h3>
      </div>
    </div>

    {/* BOTONES DE REGISTRO */}
    <div style={{
      display: 'flex',
      gap: '12px',
      flexWrap: 'wrap',
      marginTop: '28px'
    }}>
      <button
        className="primary-button"
        onClick={() => {
          setMostrarFormularioIngreso(!mostrarFormularioIngreso)
          setMostrarFormularioGasto(false)
        }}
      >
        + Registrar ingreso
      </button>

      <button
        className="secondary-button"
        onClick={() => {
          setMostrarFormularioGasto(!mostrarFormularioGasto)
          setMostrarFormularioIngreso(false)
        }}
      >
        − Registrar gasto
      </button>
    </div>

    {/* FORMULARIO DE INGRESO */}
    {mostrarFormularioIngreso && (
      <div className="panel" style={{ marginTop: '22px' }}>
        <h3>Nuevo ingreso</h3>

        <div className="form-grid">
          <input
            type="number"
            min="1"
            placeholder="Monto en guaraníes"
            value={nuevoIngreso.monto}
            onChange={(e) => setNuevoIngreso({
              ...nuevoIngreso,
              monto: e.target.value
            })}
          />

          <select
            value={nuevoIngreso.metodo_pago}
            onChange={(e) => setNuevoIngreso({
              ...nuevoIngreso,
              metodo_pago: e.target.value
            })}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>

          <input
            type="text"
            placeholder="Descripción del ingreso"
            value={nuevoIngreso.descripcion}
            onChange={(e) => setNuevoIngreso({
              ...nuevoIngreso,
              descripcion: e.target.value
            })}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="primary-button" onClick={registrarIngreso}>
            Guardar ingreso
          </button>

          <button
            className="secondary-button"
            onClick={() => setMostrarFormularioIngreso(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    )}

    {/* FORMULARIO DE GASTO */}
    {mostrarFormularioGasto && (
      <div className="panel" style={{ marginTop: '22px' }}>
        <h3>Registrar nuevo gasto</h3>
        <p>Registrá compras, alquiler, servicios y otros egresos.</p>

        <div className="form-grid">
          <input
            type="number"
            min="1"
            placeholder="Monto en guaraníes"
            value={nuevoGasto.monto}
            onChange={(e) => setNuevoGasto({
              ...nuevoGasto,
              monto: e.target.value
            })}
          />

          <select
            value={nuevoGasto.metodo_pago}
            onChange={(e) => setNuevoGasto({
              ...nuevoGasto,
              metodo_pago: e.target.value
            })}
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="otro">Otro</option>
          </select>

          <input
            type="text"
            placeholder="Descripción del gasto"
            value={nuevoGasto.descripcion}
            onChange={(e) => setNuevoGasto({
              ...nuevoGasto,
              descripcion: e.target.value
            })}
          />
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
          <button className="primary-button" onClick={registrarGasto}>
            Guardar gasto
          </button>

          <button
            className="secondary-button"
            onClick={() => setMostrarFormularioGasto(false)}
          >
            Cerrar
          </button>
        </div>
      </div>
    )}

    {/* HISTORIAL */}
    <div style={{ marginTop: '32px' }}>
      <div className="panel-heading">
        <div>
          <h3>Historial de caja</h3>
          <div style={{ marginTop: '15px', marginBottom: '18px' }}>
  <label style={{ display: 'block', marginBottom: '8px' }}>
    Filtrar movimientos por fecha
  </label>

  <input
    type="date"
    value={fechaFiltroCaja}
    onChange={(e) => setFechaFiltroCaja(e.target.value)}
  />

  <button
    className="secondary-button"
    style={{ marginLeft: '10px' }}
    onClick={() => setFechaFiltroCaja('')}
  >
    Ver todas
  </button>
</div>
          <p>
            {movimientos.length} movimientos registrados, incluidos los anulados
          </p>
        </div>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>FECHA</th>
              <th>TIPO</th>
              <th>DESCRIPCIÓN</th>
              <th>MÉTODO</th>
              <th>MONTO</th>
              <th>ESTADO</th>
              <th>ACCIÓN</th>
            </tr>
          </thead>

          <tbody>
{movimientos
  .filter((movimiento) => {
    if (!fechaFiltroCaja) return true

    const fechaMovimiento = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Asuncion'
    }).format(new Date(movimiento.fecha))

    return fechaMovimiento === fechaFiltroCaja
  })
  .map((movimiento) => (
              <tr key={movimiento.id}>
                <td>
                  {new Date(movimiento.fecha).toLocaleString('es-PY', {
                    timeZone: 'America/Asuncion'
                  })}
                </td>

                <td>
                  <strong style={{
                    color: movimiento.tipo === 'ingreso'
                      ? '#22c55e'
                      : '#ef4444'
                  }}>
                    {movimiento.tipo === 'ingreso' ? 'INGRESO' : 'GASTO'}
                  </strong>
                </td>

                <td>{movimiento.descripcion || 'Sin descripción'}</td>

                <td>
                  {movimiento.metodo_pago === 'efectivo'
                    ? 'Efectivo'
                    : movimiento.metodo_pago === 'transferencia'
                    ? 'Transferencia'
                    : movimiento.metodo_pago === 'tarjeta'
                    ? 'Tarjeta'
                    : 'Otro'}
                </td>

                <td>
                  <strong style={{
                    textDecoration: movimiento.estado === 'anulado'
                      ? 'line-through'
                      : 'none'
                  }}>
                    {formatoCaja(Number(movimiento.monto))}
                  </strong>
                </td>

                <td>
                  {movimiento.estado === 'anulado' ? (
                    <span style={{ color: '#ef4444' }}>Anulado</span>
                  ) : (
                    <span style={{ color: '#22c55e' }}>Activo</span>
                  )}
                </td>

                <td>
                  {movimiento.estado !== 'anulado' ? (
                    <button
                      className="secondary-button"
                      style={{ color: '#ef4444' }}
                      onClick={() => anularMovimiento(movimiento)}
                    >
                      Anular
                    </button>
                  ) : (
                    <span style={{ color: '#888', fontSize: '12px' }}>
                      {movimiento.motivo_anulacion || 'Sin motivo'}
                    </span>
                  )}
                </td>
              </tr>
            ))}

{movimientos.filter((movimiento) => {
  if (!fechaFiltroCaja) return true

  const fechaMovimiento = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Asuncion'
  }).format(new Date(movimiento.fecha))

  return fechaMovimiento === fechaFiltroCaja
}).length === 0 && (
              <tr>
                <td colSpan="7">
                  Todavía no hay movimientos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  </section>
)}
 
{seccionActiva === 'ingresos' && (
  <div className="income-closures-section" style={{ marginTop: '32px' }}>
    <h3>Historial de cierres</h3>
<div className="income-date-filter" style={{ marginTop: '15px', marginBottom: '18px' }}>
  <label style={{ display: 'block', marginBottom: '8px' }}>
    Filtrar cierres por fecha
  </label>

  <input
    type="date"
    value={fechaFiltroCierres}
    onChange={(e) => setFechaFiltroCierres(e.target.value)}
  />

  <button
    className="secondary-button"
    style={{ marginLeft: '10px' }}
    onClick={() => setFechaFiltroCierres('')}
  >
    Ver todas
  </button>
</div>

{cierresCaja.filter((cierre) =>
  !fechaFiltroCierres || cierre.fecha === fechaFiltroCierres
).length === 0 ? (
      <p>Todavía no hay cierres registrados.</p>
    ) : (
      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Ingresos</th>
              <th>Gastos</th>
              <th>Saldo final</th>
            </tr>
          </thead>

          <tbody>
{cierresCaja
  .filter((cierre) =>
    !fechaFiltroCierres || cierre.fecha === fechaFiltroCierres
  )
  .map((cierre) => (
              <tr key={cierre.id}>
                <td>{cierre.fecha}</td>
                <td>{formatoCaja(Number(cierre.total_ingresos))}</td>
                <td>{formatoCaja(Number(cierre.total_gastos))}</td>
                <td>{formatoCaja(Number(cierre.saldo_final))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
)}

{seccionActiva === 'calendario' && (
<section className="panel calendar-section" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
        <h3>Calendario de {negocioSeleccionado?.nombre}</h3>
        <p>Consultá las reservas por fecha y horario</p>
      </div>

      <button
        className="secondary-button"
onClick={() => setSeccionActiva('dashboard')}
      >
        Volver
      </button>
    </div>

<div className="calendar-toolbar">
  <div className="calendar-date-filter">
    <div className="calendar-filter-label">
      <span>◷</span>
      <label>Filtrar por fecha</label>
    </div>

    <div className="calendar-filter-controls">
      <input
        type="date"
        value={fechaCalendario}
        onChange={(e) => setFechaCalendario(e.target.value)}
      />

      <button
        className="secondary-button"
        onClick={() => setFechaCalendario('')}
      >
        Ver todas
      </button>
    </div>
  </div>

  <div className="calendar-total-card">
    <span className="calendar-total-icon">▦</span>
    <div>
      <p>Reservas encontradas</p>
      <h3>
        {reservas.filter((r) =>
          !fechaCalendario || r.fecha === fechaCalendario
        ).length}
      </h3>
    </div>
  </div>
</div>

    <div className="table-wrap" style={{ marginTop: '24px' }}>
      <table>
        <thead>
          <tr>
            <th>FECHA</th>
            <th>HORARIO</th>
            <th>CLIENTE</th>
            <th>WHATSAPP</th>
            <th>SERVICIO</th>
            <th>ESTADO</th>
          </tr>
        </thead>

        <tbody>
          {reservas
            .filter((r) =>
              !fechaCalendario || r.fecha === fechaCalendario
            )
            .map((reserva) => (
              <tr key={reserva.id}>
                <td>{reserva.fecha}</td>
                <td>{String(reserva.hora).slice(0, 5)}</td>
                <td>
                  <strong>{reserva.cliente_nombre}</strong>
                </td>
                <td>{reserva.cliente_whatsapp}</td>
                <td>{reserva.servicios?.nombre || 'Sin servicio'}</td>
                <td>{reserva.estado}</td>
              </tr>
            ))}

          {reservas.filter((r) =>
            !fechaCalendario || r.fecha === fechaCalendario
          ).length === 0 && (
            <tr>
              <td colSpan="6">
                No hay reservas para esta fecha.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </section>
)}

{seccionActiva === 'servicios' && (
  <>

    <section className="panel" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
        <h3>Servicios de {negocioSeleccionado?.nombre}</h3>
<p style={{ color: '#a78bfa' }}>
  {servicioEditando
    ? `EDITANDO: ${servicioEditando.nombre}`
    : 'MODO: AGREGAR SERVICIO'}
</p>

<p>Administrá los servicios, precios y duración</p>
      </div>

      <button
        className="secondary-button"
onClick={() => setSeccionActiva('dashboard')}
      >
        Volver
      </button>
    </div>

<div className="services-form" ref={formularioServiciosRef}>

  <div className="services-form-heading">
    <div>
      <span>GESTIÓN DE SERVICIOS</span>
      <h3>{servicioEditando ? 'Editar servicio' : 'Agregar nuevo servicio'}</h3>
      <p>Completá los datos para registrar tu servicio.</p>
    </div>
    <div className="services-form-icon">✂</div>
  </div>

  <div className="services-form-fields">

    <div className="services-field">
      <label>Nombre del servicio</label>
      <input
        type="text"
        placeholder="Ej. Corte de cabello"
        value={nuevoServicio.nombre}
        onChange={(e) =>
          setNuevoServicio({
            ...nuevoServicio,
            nombre: e.target.value
          })
        }
      />
    </div>

    <div className="services-field">
      <label>Precio en guaraníes</label>
      <input
        type="number"
        placeholder="Ej. 50000"
        value={nuevoServicio.precio}
        onChange={(e) =>
          setNuevoServicio({
            ...nuevoServicio,
            precio: e.target.value
          })
        }
      />
    </div>

    <button
      className="primary-button services-submit"
      onClick={registrarServicio}
    >
      {servicioEditando ? 'Guardar cambios' : '+ Agregar servicio'}
    </button>

  </div>
</div>

    <div className="services-cards-grid">
  {servicios.map((servicio) => (
    <div className="service-card" key={servicio.id}>
      <div className="service-card-top">
        <div className="service-card-icon">✂</div>
        <span className="service-card-label">SERVICIO</span>
      </div>

      <h3>{servicio.nombre}</h3>

      <div className="service-card-details">
        <div>
          <span>PRECIO</span>
          <strong>
            Gs. {Number(servicio.precio).toLocaleString('es-PY')}
          </strong>
        </div>

        <div>
          <span>DURACIÓN</span>
          <strong>{servicio.duracion} minutos</strong>
        </div>
      </div>

      <div className="service-card-actions">
        <button
          className="secondary-button"
          onClick={() => prepararEdicionServicio(servicio)}
        >
          ✎ Editar
        </button>

        <button
          className="secondary-button"
          style={{ color: '#ff5555' }}
          onClick={() => eliminarServicio(servicio.id)}
        >
          Eliminar
        </button>
      </div>
    </div>
  ))}

  {servicios.length === 0 && (
    <p className="services-empty">
      Todavía no hay servicios registrados.
    </p>
  )}
</div>
    </section>
  </>
)}
{seccionActiva === 'reservas' && (
  <section className="panel" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
<h3>
  {negocioSeleccionado
    ? `Reservas de ${negocioSeleccionado.nombre}`
    : 'Reservas de todos los negocios'}
</h3>
        <p>Administrá las reservas de tus clientes</p>
      </div>

      <button
        className="secondary-button"
onClick={() => setSeccionActiva('dashboard')}
      >
        Volver
      </button>
    </div>
<div className="stats-grid" style={{ marginBottom: '24px' }}>

  <div className="stat-card">
    <p>Total de reservas</p>
    <h2>{totalReservas}</h2>
  </div>

  <div className="stat-card">
    <p>Reservas confirmadas</p>
    <h2>{reservasConfirmadas}</h2>
  </div>

  <div className="stat-card">
    <p>Ingresos confirmados</p>
    <h2>
      Gs. {ingresosConfirmados.toLocaleString('es-PY')}
    </h2>
  </div>

</div>
<div className="reservations-filters">

  <div className="reservation-filter-card">
    <label>⌖ Filtrar por fecha</label>

    <div className="reservation-filter-control">
      <input
        type="date"
        value={fechaFiltro}
        onChange={(e) => setFechaFiltro(e.target.value)}
      />

      <button
        className="secondary-button"
        onClick={() => setFechaFiltro('')}
      >
        Ver todas
      </button>
    </div>
  </div>

  <div className="reservation-filter-card">
    <label>◷ Filtrar por estado</label>

    <select
      value={estadoFiltro}
      onChange={(e) => setEstadoFiltro(e.target.value)}
    >
      <option value="Todas">Todas</option>
      <option value="Pendiente">Pendientes</option>
      <option value="Confirmada">Confirmadas</option>
      <option value="Cancelada">Canceladas</option>
    </select>
  </div>

</div>
    {reservaEditando && (
  <div className="panel" style={{ marginBottom: '24px' }}>
    <h3>Editar reserva</h3>

    <div className="form-grid">
      <input
        type="text"
        placeholder="Nombre del cliente"
        value={datosReservaEditada.cliente_nombre}
        onChange={(e) =>
          setDatosReservaEditada({
            ...datosReservaEditada,
            cliente_nombre: e.target.value
          })
        }
      />

      <input
        type="text"
        placeholder="WhatsApp"
        value={datosReservaEditada.cliente_whatsapp}
        onChange={(e) =>
          setDatosReservaEditada({
            ...datosReservaEditada,
            cliente_whatsapp: e.target.value
          })
        }
      />

      <select
        value={datosReservaEditada.servicio_id}
        onChange={(e) =>
          setDatosReservaEditada({
            ...datosReservaEditada,
            servicio_id: e.target.value
          })
        }
      >
        <option value="">Seleccionar servicio</option>
        {servicios.map((servicio) => (
          <option key={servicio.id} value={servicio.id}>
            {servicio.nombre} - Gs. {Number(servicio.precio).toLocaleString('es-PY')}
          </option>
        ))}
      </select>

      <input
        type="date"
        value={datosReservaEditada.fecha}
        onChange={(e) =>
          setDatosReservaEditada({
            ...datosReservaEditada,
            fecha: e.target.value
          })
        }
      />

      <input
        type="time"
        value={datosReservaEditada.hora}
        onChange={(e) =>
          setDatosReservaEditada({
            ...datosReservaEditada,
            hora: e.target.value
          })
        }
      />

      <button className="primary-button" onClick={guardarEdicionReserva}>
        Guardar cambios
      </button>

      <button
        className="secondary-button"
        onClick={() => setReservaEditando(null)}
      >
        Cancelar edición
      </button>
    </div>
  </div>
)}
 
<div className="table-wrap reservations-table-wrap">

  <div className="reservations-search">
    <span>⌕</span>
    <input
      type="text"
      placeholder="Buscar por código, cliente o WhatsApp..."
      value={busquedaReserva}
      onChange={(e) => setBusquedaReserva(e.target.value)}
    />
  </div>

  <div className="reservations-table-scroll">
    <table className="reservations-table">
      <thead>
        <tr>
          <th>CÓDIGO</th>
          <th>CLIENTE</th>
          <th>WHATSAPP</th>
          <th>SERVICIO</th>
          <th>PRECIO</th>
          <th>DURACIÓN</th>
          <th>FECHA</th>
          <th>HORA</th>
          <th>ESTADO</th>
          <th>ACCIONES</th>
          <th>COBRO</th>
        </tr>
      </thead>

      <tbody>
        {reservasFiltradas.map((reserva) => (
          <tr key={reserva.id}>

            <td>
              <div className="reservation-code">
                <strong>#{reserva.id}</strong>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(`#${reserva.id}`)
                      .then(() => alert('¡Código copiado!'))
                      .catch(() => alert('No se pudo copiar el código.'))
                  }}
                >
                  Copiar
                </button>
              </div>
            </td>

            <td>
              <strong>{reserva.cliente_nombre}</strong>
            </td>

            <td>
              <a
                className="reservation-whatsapp"
                href={`https://wa.me/${reserva.cliente_whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hola ' + reserva.cliente_nombre + ', te contactamos por tu reserva del ' + reserva.fecha + ' a las ' + reserva.hora + '.')}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                Contactar ↗
              </a>
            </td>

            <td>{reserva.servicios?.nombre || 'Sin servicio'}</td>

            <td>
              <strong>
                Gs. {Number(reserva.servicios?.precio || 0).toLocaleString('es-PY')}
              </strong>
            </td>

            <td>{reserva.servicios?.duracion || 0} min</td>

            <td>{reserva.fecha}</td>

            <td>{reserva.hora}</td>

            <td>
              <span className={`reservation-status ${
                reserva.estado === 'Confirmada'
                  ? 'status-confirmed'
                  : reserva.estado === 'Cancelada'
                  ? 'status-cancelled'
                  : 'status-pending'
              }`}>
                {reserva.estado}
              </span>
            </td>

            <td>
              <div className="reservation-actions">

                {reserva.estado === 'Pendiente' && (
                  <button
                    className="reservation-action-confirm"
                    onClick={() => actualizarEstadoReserva(reserva, 'Confirmada')}
                  >
                    Confirmar
                  </button>
                )}

                {reserva.estado !== 'Cancelada' && (
                  <button
                    className="reservation-action-cancel"
                    onClick={() => actualizarEstadoReserva(reserva, 'Cancelada')}
                  >
                    Cancelar
                  </button>
                )}

                <button
                  className="reservation-action-edit"
                  onClick={() => prepararEdicionReserva(reserva)}
                >
                  Editar
                </button>

                <button
                  className="reservation-action-delete"
                  onClick={() => eliminarReserva(reserva.id)}
                >
                  Eliminar
                </button>

              </div>
            </td>

            <td>
              {reserva.estado === 'Confirmada' ? (
                movimientosDashboard.some(
                  (movimiento) =>
                    String(movimiento.reserva_id) === String(reserva.id)
                ) ? (
                  <span className="reservation-paid">✓ Cobrado</span>
                ) : (
                  <button
                    className="reservation-action-payment"
                    onClick={() => registrarCobroReserva(reserva)}
                  >
                    Registrar cobro
                  </button>
                )
              ) : (
                <span className="reservation-no-payment">—</span>
              )}
            </td>

          </tr>
        ))}

        {reservasFiltradas.length === 0 && (
          <tr>
            <td colSpan="11" className="reservations-empty">
              Todavía no hay reservas registradas.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  </div>

</div>

  </section>
)}

{seccionActiva === 'negocio' && (
  <section className="business-profile">
    <div className="business-profile-heading">
      <div>
        <span className="business-profile-eyebrow">INFORMACIÓN GENERAL</span>
        <h2>Mi negocio</h2>
        <p>Administrá y consultá la información de tu establecimiento.</p>
      </div>

      {negocios[0] && (
        <button
          className="primary-button"
          onClick={() => prepararEdicion(negocios[0])}
        >
          ✎ Editar información
        </button>
      )}
    </div>

    {negocios[0] ? (
      <>
        <div className="business-profile-hero">
          <div className="business-profile-logo">
            {(negocios[0].nombre || 'N').charAt(0).toUpperCase()}
          </div>

          <div className="business-profile-identity">
            <span>ESTABLECIMIENTO</span>
            <h2>{negocios[0].nombre}</h2>
            <p>{negocios[0].tipo || 'Tipo de negocio no especificado'}</p>
          </div>

          <div className="business-profile-status">
            <span></span>
            Negocio registrado
          </div>
        </div>

        <div className="business-profile-section-title">
          <div>
            <h3>Datos del establecimiento</h3>
            <p>Información principal de tu negocio</p>
          </div>
        </div>

        <div className="business-profile-grid">
          <div className="business-info-card">
            <span className="business-info-icon">♙</span>
            <div>
              <span>Propietario</span>
              <h3>{negocios[0].propietario || 'No especificado'}</h3>
            </div>
          </div>

          <div className="business-info-card">
            <span className="business-info-icon">▣</span>
            <div>
              <span>WhatsApp de contacto</span>
              <h3>{negocios[0].whatsapp || 'No especificado'}</h3>
            </div>
          </div>

          <div className="business-info-card">
            <span className="business-info-icon">⌖</span>
            <div>
              <span>Dirección</span>
              <h3>{negocios[0].direccion || 'No especificada'}</h3>
            </div>
          </div>

          <div className="business-info-card">
            <span className="business-info-icon">◷</span>
            <div>
              <span>Horario de atención</span>
              <h3>
                {negocios[0].hora_apertura || '--:--'} a{' '}
                {negocios[0].hora_cierre || '--:--'}
              </h3>
            </div>
          </div>

          <div className="business-info-card business-info-card-wide">
            <span className="business-info-icon">▦</span>
            <div>
              <span>Días de atención</span>
              <h3>{negocios[0].dias_atencion || 'No especificados'}</h3>
            </div>
          </div>
        </div>
      </>
    ) : (
      <div className="business-profile-empty">
        <h3>No se encontró información</h3>
        <p>Todavía no hay un negocio asociado a tu cuenta.</p>
      </div>
    )}
  </section>
)}

{seccionActiva === 'personalizar' && !esSuperAdmin && (
  <PersonalizarNegocio negocio={negocios[0]} />
)}

{seccionActiva === 'estadisticas' && (
  <section className="panel" style={{ marginTop: '24px' }}>
    <div className="panel-heading">
      <div>
        <h3>Estadísticas de {negocios[0]?.nombre || 'mi negocio'}</h3>
        <p>Resumen del rendimiento de tu negocio</p>
      </div>

      <button
        className="secondary-button"
        onClick={() => setSeccionActiva('dashboard')}
      >
        Volver
      </button>
    </div>

    <h3 style={{ margin: '25px 0 15px' }}>Resumen de reservas</h3>

    <div className="stats-grid">
      <div className="stat-card">
        <p>Total de reservas</p>
        <h2>{reservas.length}</h2>
      </div>

      <div className="stat-card">
        <p>Confirmadas</p>
        <h2>
          {reservas.filter(r => r.estado === 'Confirmada').length}
        </h2>
      </div>

      <div className="stat-card">
        <p>Pendientes</p>
        <h2>
          {reservas.filter(r => r.estado === 'Pendiente').length}
        </h2>
      </div>

      <div className="stat-card">
        <p>Canceladas</p>
        <h2>
          {reservas.filter(r => r.estado === 'Cancelada').length}
        </h2>
      </div>
    </div>

    <h3 style={{ margin: '30px 0 15px' }}>Resumen financiero</h3>

    <div className="stats-grid">
      <div className="stat-card">
        <p>Ingresos de hoy</p>
        <h2>{formatoCaja(ingresosHoy)}</h2>
      </div>

      <div className="stat-card">
        <p>Gastos de hoy</p>
        <h2>{formatoCaja(gastosHoy)}</h2>
      </div>

      <div className="stat-card">
        <p>Balance de hoy</p>
        <h2>{formatoCaja(balanceHoy)}</h2>
      </div>

      <div className="stat-card">
        <p>Ingresos del mes</p>
        <h2>{formatoCaja(ingresosMesCaja)}</h2>
      </div>

      <div className="stat-card">
        <p>Gastos del mes</p>
        <h2>{formatoCaja(gastosMesCaja)}</h2>
      </div>

      <div className="stat-card">
        <p>Balance del mes</p>
        <h2>{formatoCaja(balanceMesCaja)}</h2>
      </div>
    </div>

<div style={{
  display: 'flex',
  gap: '10px',
  flexWrap: 'wrap',
  margin: '25px 0'
}}>
  {[
    { valor: '7dias', texto: 'Últimos 7 días' },
    { valor: '30dias', texto: 'Últimos 30 días' },
    { valor: '6meses', texto: 'Últimos 6 meses' }
  ].map(opcion => (
    <button
      key={opcion.valor}
      onClick={() => setPeriodoEstadisticas(opcion.valor)}
      style={{
        padding: '11px 18px',
        borderRadius: '9px',
        border: '1px solid #16a34a',
        background: periodoEstadisticas === opcion.valor
          ? '#16a34a'
          : 'transparent',
        color: periodoEstadisticas === opcion.valor
          ? '#ffffff'
          : '#16a34a',
        fontWeight: '600',
        cursor: 'pointer'
      }}
    >
      {opcion.texto}
    </button>
  ))}
</div>

<h3 style={{ margin: '30px 0 15px' }}>
  Evolución de ingresos y gastos
</h3>

<div className="panel" style={{ padding: '20px', marginBottom: '25px' }}>
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    gap: '20px',
    flexWrap: 'wrap',
    marginBottom: '20px'
  }}>
    <div style={{ display: 'flex', gap: '18px', flexWrap: 'wrap' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: '#16a34a'
        }} />
        Ingresos
      </span>

      <span style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
        <span style={{
          width: '12px',
          height: '12px',
          borderRadius: '3px',
          background: '#ef4444'
        }} />
        Gastos
      </span>
    </div>
  </div>

  <div style={{
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    gap: '12px',
    height: '240px',
    paddingTop: '15px',
    borderBottom: '1px solid #ddd'
  }}>
    {estadisticasGrafico.map((dato, indice) => {
      const maximo = Math.max(
        1,
estadisticasGrafico.flatMap(m => [
          m.ingresos,
          m.gastos
        ])
      )

      const alturaIngreso = (dato.ingresos / maximo) * 180
      const alturaGasto = (dato.gastos / maximo) * 180

      return (
        <div key={indice} style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'flex-end',
          height: '100%',
          gap: '8px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            gap: '5px',
            height: '190px',
            width: '100%'
          }}>
            <div
              title={`Ingresos: ${formatoCaja(dato.ingresos)}`}
              style={{
                width: 'min(28px, 40%)',
                height: `${alturaIngreso}px`,
                minHeight: dato.ingresos > 0 ? '3px' : '0',
                background: '#16a34a',
                borderRadius: '5px 5px 0 0'
              }}
            />

            <div
              title={`Gastos: ${formatoCaja(dato.gastos)}`}
              style={{
                width: 'min(28px, 40%)',
                height: `${alturaGasto}px`,
                minHeight: dato.gastos > 0 ? '3px' : '0',
                background: '#ef4444',
                borderRadius: '5px 5px 0 0'
              }}
            />
          </div>

          <span style={{
            fontSize: '12px',
            textTransform: 'capitalize'
          }}>
            {dato.mes}
          </span>
        </div>
      )
    })}
  </div>

  <p style={{
    fontSize: '12px',
    color: '#777',
    marginTop: '15px'
  }}>
    Comparación mensual de movimientos registrados en caja.
    Pasá el cursor sobre las barras para consultar los montos.
  </p>
</div>

<h3 style={{ margin: '30px 0 15px' }}>
  Servicios más solicitados
</h3>

<div className="panel" style={{
  padding: '22px',
  marginBottom: '25px'
}}>
  {rankingServicios.length === 0 ? (
    <p style={{ color: '#888' }}>
      Todavía no hay reservas para mostrar estadísticas de servicios.
    </p>
  ) : (
    rankingServicios.map((servicio, indice) => {
      const maximo = rankingServicios[0].cantidad
      const porcentaje = (servicio.cantidad / maximo) * 100

      return (
        <div key={servicio.nombre} style={{
          marginBottom: '22px'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '9px'
          }}>
            <strong>
              {indice + 1}. {servicio.nombre}
            </strong>

            <span style={{
              color: '#777',
              fontSize: '13px',
              whiteSpace: 'nowrap'
            }}>
              {servicio.cantidad} {servicio.cantidad === 1 ? 'reserva' : 'reservas'}
            </span>
          </div>

          <div style={{
            width: '100%',
            height: '10px',
            background: '#e5e7eb',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentaje}%`,
              height: '100%',
              background: '#16a34a',
              borderRadius: '20px',
              transition: 'width 0.3s ease'
            }} />
          </div>
        </div>
      )
    })
  )}
</div>

<h3 style={{ margin: '30px 0 15px' }}>
  Días con más reservas
</h3>

<div className="panel" style={{
  padding: '22px',
  marginBottom: '25px'
}}>
  {rankingDias.length === 0 ? (
    <p style={{ color: '#888' }}>
      Todavía no hay reservas para mostrar.
    </p>
  ) : (
    rankingDias.map((dia, indice) => {
      const maximo = rankingDias[0].cantidad
      const porcentaje = (dia.cantidad / maximo) * 100

      return (
        <div key={dia.nombre} style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <strong>{dia.nombre}</strong>
            <span>{dia.cantidad} reservas</span>
          </div>

          <div style={{
            height: '10px',
            background: '#e5e7eb',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentaje}%`,
              height: '100%',
              background: '#2563eb',
              borderRadius: '20px'
            }} />
          </div>
        </div>
      )
    })
  )}
</div>

<h3 style={{ margin: '30px 0 15px' }}>
  Horarios más solicitados
</h3>

<div className="panel" style={{
  padding: '22px',
  marginBottom: '25px'
}}>
  {rankingHorarios.length === 0 ? (
    <p style={{ color: '#888' }}>
      Todavía no hay horarios registrados.
    </p>
  ) : (
    rankingHorarios.map((horario, indice) => {
      const maximo = rankingHorarios[0].cantidad
      const porcentaje = (horario.cantidad / maximo) * 100

      return (
        <div key={horario.hora} style={{ marginBottom: '18px' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '8px'
          }}>
            <strong>{horario.hora}</strong>
            <span>{horario.cantidad} reservas</span>
          </div>

          <div style={{
            height: '10px',
            background: '#e5e7eb',
            borderRadius: '20px',
            overflow: 'hidden'
          }}>
            <div style={{
              width: `${porcentaje}%`,
              height: '100%',
              background: '#8b5cf6',
              borderRadius: '20px'
            }} />
          </div>
        </div>
      )
    })
  )}
</div>

    <h3 style={{ margin: '30px 0 15px' }}>Métodos de pago del mes</h3>

    <div className="stats-grid">
      {['efectivo', 'transferencia', 'tarjeta', 'otro'].map(metodo => {
        const total = movimientosMes
          .filter(m => m.tipo === 'ingreso' && m.metodo_pago === metodo)
          .reduce((suma, m) => suma + Number(m.monto || 0), 0)

        return (
          <div className="stat-card" key={metodo}>
            <p>{metodo.charAt(0).toUpperCase() + metodo.slice(1)}</p>
            <h2>{formatoCaja(total)}</h2>
          </div>
        )
      })}
    </div>
  </section>
)}

          <footer>© 2026 VERZIX. Todos los derechos reservados.</footer>
        </section>
      </main>
    </div>
  )
}
function App() {
  const ruta = window.location.pathname

  if (ruta !== '/') {
    return <PaginaNegocio />
  }

  return <PanelAdmin />
}
export default App
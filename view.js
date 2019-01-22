/*global document Map*/
/*prettier-ignore*/
"use strict"

module.exports = function(dot, opts) {
  var state = dot.state

  if (state.view) {
    return
  }

  state.view = opts || {}
  state.views = state.views || new Map()

  if (state.log) {
    state.log.levels.view = state.log.levels.view || {
      info: "debug",
    }
  }

  dot.beforeAny("view", view)
}

function view(prop, arg, dot) {
  dot.beforeAny(prop[0], renderOrUpdate)
  dot.beforeAny(prop[0] + "Render", arg.render)
  dot.any(prop[0] + "Update", arg.update)
}

function renderOrUpdate(prop, arg, dot, e, sig) {
  arg = arg || {}

  var views = dot.state.views

  var exists = views.has(e),
    v = getOrCreateView(prop, arg, dot, e)

  var a = Object.assign({}, arg, v)
  a.ssr = !exists && !!v.element && !!v.element.innerHTML

  views.set(e, v)

  if (v.element && v.element.innerHTML) {
    return dot[e + "Update"](prop, a)
  } else {
    var el = dot[e + "Render"](prop, a)

    if (v.element && el) {
      if (v.element.parentNode) {
        v.element.parentNode.replaceChild(el, v.element)
      } else {
        v.element.appendChild(el)
      }
    }

    v.element = el
    sig.value = v.element
  }
}

function getOrCreateView(prop, arg, dot, e) {
  return (
    dot.state.views.get(e) || {
      element: arg.element || findElement(prop, arg),
    }
  )
}

function findElement(prop, arg) {
  if (arg.selector || prop.length) {
    return document.querySelector(
      arg.selector || prop.join(".")
    )
  }
}

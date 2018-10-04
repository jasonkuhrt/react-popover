const px = (n: number) => {
  return `${n}px`
}

const noop = () => {
  return undefined
}

/**
 * Find the intersection and differences between two sets.
 * Upon every intersection the intersecting items are deleted
 * from their respective lists. Therefore it is essential that
 * the given data really is a set otherwise the result of this
 * function will be incorrect.
 */
const venn = <A extends unknown>(
  xsSource: Array<A>,
  zsSource: Array<A>,
): [Array<A>, Array<A>, Array<A>] => {
  const as = [...xsSource]
  const bs = [...zsSource]
  const abs: Array<A> = []

  if (as.length === 0) return [as, abs, bs]
  if (bs.length === 0) return [as, abs, bs]

  let ia = 0
  loop: while (ia < as.length && bs.length) {
    const a = as[ia]
    let ib = 0

    while (ib < bs.length) {
      const b = bs[ib]

      if (a === b) {
        abs.push(a)
        as.splice(ia, 1)
        bs.splice(ib, 1)
        continue loop
      }

      ib++
    }

    ia++
  }

  return [as, abs, bs]
}

export { px, noop, venn }

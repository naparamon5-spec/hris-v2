// Client-side paging for a list.
//   const { page, pageRows, total, pages } = usePagination(rows, 8)
// `rows` is a ref/computed array. Goes back to page 1 when the list changes
// length (e.g. a filter or search), and never points past the last page.
export const usePagination = (rows, perPage = 8) => {
  const page = ref(1)
  const size = ref(perPage)
  const total = computed(() => unref(rows).length)
  const pages = computed(() => Math.max(1, Math.ceil(total.value / size.value)))
  const pageRows = computed(() => unref(rows).slice((page.value - 1) * size.value, page.value * size.value))

  watch(total, () => { page.value = 1 })
  watch(pages, (n) => { if (page.value > n) page.value = n })

  return { page, size, total, pages, pageRows }
}

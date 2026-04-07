export interface SearchSuggestionType {
  type: 'keyword' | 'tag' | 'company'
  mode: 'include' | 'exclude'
  id?: number
  name: string
}

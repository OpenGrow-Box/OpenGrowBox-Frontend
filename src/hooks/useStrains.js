import { useState, useEffect } from 'react'
import { supabase } from '../utils/supabase'

export const useStrains = () => {
  const [strains, setStrains] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedStrain, setSelectedStrain] = useState(null)

  // Fetch all strains
  const fetchStrains = async (filters = {}) => {
    try {
      setLoading(true)
      let query = supabase.from('strains').select('*')

      // Apply filters
      if (filters.search) {
        query = query.ilike('Name', `%${filters.search}%`)
      }
      if (filters.genetics) {
        query = query.eq('Genetik', filters.genetics)
      }
      if (filters.growLevel) {
        query = query.eq('GrowLevel', filters.growLevel)
      }
      if (filters.minTHC) {
        query = query.gte('THC', filters.minTHC)
      }
      if (filters.maxTHC) {
        query = query.lte('THC', filters.maxTHC)
      }

      const { data, error } = await query
      if (error) throw error
      setStrains(data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Fetch single strain details
  const fetchStrainDetails = async (strainId) => {
    try {
      const { data, error } = await supabase
        .from('strains')
        .select('*')
        .eq('StrainID', strainId)
        .single()

      if (error) throw error
      setSelectedStrain(data)
      return data
    } catch (err) {
      setError(err.message)
      return null
    }
  }

  useEffect(() => {
    fetchStrains()
  }, [])

  return {
    strains,
    loading,
    error,
    selectedStrain,
    fetchStrains,
    fetchStrainDetails,
    setSelectedStrain
  }
}
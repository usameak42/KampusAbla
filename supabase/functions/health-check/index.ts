import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
    try {
        const startTime = Date.now()

        // Test database connection
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // Simple health check query
        const { error } = await supabaseClient
            .from('users')
            .select('id')
            .limit(1)

        const responseTime = Date.now() - startTime

        if (error) {
            throw error
        }

        return new Response(
            JSON.stringify({
                status: 'healthy',
                database: 'connected',
                responseTime: `${responseTime}ms`,
                timestamp: new Date().toISOString()
            }),
            {
                headers: { "Content-Type": "application/json" },
                status: 200
            }
        )
    } catch (error) {
        return new Response(
            JSON.stringify({
                status: 'unhealthy',
                database: 'disconnected',
                error: error.message,
                timestamp: new Date().toISOString()
            }),
            {
                headers: { "Content-Type": "application/json" },
                status: 503
            }
        )
    }
})
// backend/database/supabase.js
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY; // Используем service key!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL или SUPABASE_SERVICE_KEY не найдены');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = {
  async getUserByTelegramId(telegramId) {
    try {
      console.log('🔍 Поиск пользователя по telegramId:', telegramId);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('telegramId', telegramId)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Ошибка поиска:', error);
        return null;
      }
      
      console.log('✅ Найден:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка в getUserByTelegramId:', error);
      return null;
    }
  },
  
  async getUserByToken(token) {
    try {
      console.log('🔍 Поиск пользователя по токену:', token);
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      
      if (error) {
        console.error('❌ Ошибка поиска:', error);
        return null;
      }
      
      console.log('✅ Найден:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка в getUserByToken:', error);
      return null;
    }
  },
  
  async createUser({ telegramId, username, token }) {
    try {
      console.log('➕ Создание пользователя:', { telegramId, username, token });
      
      const { data, error } = await supabase
        .from('users')
        .insert([{
          telegramId,
          username,
          token
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка создания:', error);
        throw error;
      }
      
      console.log('✅ Создан:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка в createUser:', error);
      throw error;
    }
  },
  
  async updateUserToken(id, token) {
    try {
      console.log('🔄 Обновление токена для пользователя:', id);
      
      const { data, error } = await supabase
        .from('users')
        .update({ 
          token, 
          updatedAt: new Date().toISOString() 
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка обновления:', error);
        throw error;
      }
      
      console.log('✅ Обновлен:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка в updateUserToken:', error);
      throw error;
    }
  },
  
  async saveReport({ userId, flightId, report }) {
    try {
      console.log('📝 Сохранение отчета:', { userId, flightId });
      
      const { data, error } = await supabase
        .from('reports')
        .insert([{
          userId,
          flightId,
          report
        }])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Ошибка сохранения отчета:', error);
        throw error;
      }
      
      console.log('✅ Отчет сохранен:', data);
      return data;
    } catch (error) {
      console.error('❌ Ошибка в saveReport:', error);
      throw error;
    }
  },
  
  async getReportsByUser(userId) {
    try {
      const { data, error } = await supabase
        .from('reports')
        .select('*')
        .eq('userId', userId)
        .order('sentAt', { ascending: false });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('❌ Ошибка получения отчетов:', error);
      return [];
    }
  }
};
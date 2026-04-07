const tokenSetup = async (entity, value, connection) => {
    // console.log(entity,value)

    if (connection) {
      try {
        await connection.sendMessagePromise({
          type: 'call_service',
          domain: 'opengrowbox',
          service: 'update_text',
          service_data: {
            entity_id: entity,
            text: value,
          },
        });

      } catch (error) {
        // console.error('Error updating entity:', error);
      }
    }
  };

export default tokenSetup
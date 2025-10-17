import styled from "styled-components";
import { useHomeAssistant } from "../../Context/HomeAssistantContext";

const TextCard = ({ entities }) => {
  const { connection } = useHomeAssistant();

  if (!entities || entities.length === 0) {
    return <p>No text entities available</p>;
  }

  const handleTextChange = async (entity, value) => {
    if (!connection) return;

    try {
      await connection.sendMessagePromise({
        type: "call_service",
        domain: "text",
        service: "set_value",
        service_data: {
          entity_id: entity.entity_id,
          value: value,
        },
      });
    } catch (error) {
      console.error("Error updating text entity:", error);
    }
  };

  return (
    <Container>
      {entities.map((entity) => (
        <Card key={entity.entity_id}>
          <CardHeader>
            <Tooltip>{entity.tooltip}</Tooltip>
            <Title>{entity.title || entity.friendly_name}</Title>
            <Value>{entity.state}</Value>
            {entity.unit && <Unit>{entity.unit}</Unit>}
          </CardHeader>
          <InputWrapper>
            <TextInput
              type="text"
              defaultValue={entity.state}
              placeholder={entity.placeholder || "Enter value..."}
              onBlur={(e) => handleTextChange(entity, e.target.value)}
            />
          </InputWrapper>
        </Card>
      ))}
    </Container>
  );
};

export default TextCard;

// ==== STYLES ====

const Container = styled.div`
  display: flex;
  width: 100%;
  flex-direction: column;
  justify-content: center;
  margin-top: 0.45rem;
  gap: 0.5rem;
  color: var(--main-text-color);
`;

const Tooltip = styled.div`
  position: absolute;
  top: -1.5rem;
  left: 1rem;
  background-color: rgba(50, 50, 50, 0.9);
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.7rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.2s ease-in-out;
`;

const Card = styled.div`
  position: relative;
  background: var(--main-bg-Innercard-color);
  border-radius: 8px;
  box-shadow: var(--main-shadow-art);
  display: flex;
  flex-direction: column;

  &:hover ${Tooltip} {
    opacity: 1;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;
`;

const Title = styled.p`
  margin-left: 1rem;
  font-size: 0.8rem;
  font-weight: bold;
  width: 80%;
`;

const InputWrapper = styled.div`
  display: flex;
  align-items: center;
  width: 100%;
  padding: 0.4rem 1rem 1rem 1rem;
`;

const TextInput = styled.input`
  flex-grow: 1;
  background: transparent;
  border: 1px solid var(--main-unit-color);
  color: var(--main-value-color);
  font-size: 0.9rem;
  padding: 0.4rem;
  border-radius: 6px;
  outline: none;
  transition: 0.2s ease border-color;

  &:focus {
    border-color: var(--main-value-color);
  }
`;

const Value = styled.div`
  color: var(--main-value-color);
`;

const Unit = styled.div`
  padding-left: 0.3rem;
  margin-right: 0.4rem;
  width: 15%;
  color: var(--main-unit-color);
`;

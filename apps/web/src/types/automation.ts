export interface AutomationRule {
  id: string;
  boardId: string;
  name: string;
  enabled: boolean;
  trigger: "ticket_created" | "field_changed" | "due_date_passed";
  conditionField: string;
  conditionOp: string;
  conditionValue: string | null;
  action: "move_to_column" | "set_field" | "add_tag";
  actionParams: string;
  createdAt: string;
  updatedAt: string;
}

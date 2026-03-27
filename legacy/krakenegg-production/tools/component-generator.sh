#!/bin/bash

# KrakenEgg Component Generator
# Generates new React components with TypeScript and proper structure

set -e

if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide a component name"
    echo "Usage: $0 <ComponentName> [component-type]"
    echo "Component types: dialog, panel, common, layout"
    echo "Example: $0 MyDialog dialog"
    exit 1
fi

COMPONENT_NAME="$1"
COMPONENT_TYPE="${2:-common}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
VERSION_DIR="$PROJECT_ROOT/versions/v1.0.0"
COMPONENT_DIR="$VERSION_DIR/src/components/$COMPONENT_TYPE"

echo "🐙 Generating KrakenEgg Component"
echo "Component: $COMPONENT_NAME"
echo "Type: $COMPONENT_TYPE"
echo "Directory: $COMPONENT_DIR"
echo ""

# Create component directory if it doesn't exist
mkdir -p "$COMPONENT_DIR"

# Generate the component file
COMPONENT_FILE="$COMPONENT_DIR/$COMPONENT_NAME.tsx"

if [ -f "$COMPONENT_FILE" ]; then
    echo "❌ Error: Component $COMPONENT_NAME already exists"
    exit 1
fi

cat > "$COMPONENT_FILE" << EOF
import { ReactNode } from 'react';

interface ${COMPONENT_NAME}Props {
  children?: ReactNode;
  className?: string;
}

const $COMPONENT_NAME = ({ children, className = '' }: ${COMPONENT_NAME}Props) => {
  return (
    <div className={\`${COMPONENT_NAME.toLowerCase()} \${className}\`}>
      {children}
    </div>
  );
};

export default $COMPONENT_NAME;
EOF

echo "✅ Component created: $COMPONENT_FILE"

# Generate a basic test file
TEST_DIR="$VERSION_DIR/src/components/__tests__"
mkdir -p "$TEST_DIR"
TEST_FILE="$TEST_DIR/$COMPONENT_NAME.test.tsx"

cat > "$TEST_FILE" << EOF
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import $COMPONENT_NAME from '../$COMPONENT_TYPE/$COMPONENT_NAME';

describe('$COMPONENT_NAME', () => {
  it('renders correctly', () => {
    render(<$COMPONENT_NAME />);
    expect(screen.getByRole('generic')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(<$COMPONENT_NAME className="custom-class" />);
    expect(screen.getByRole('generic')).toHaveClass('custom-class');
  });

  it('renders children', () => {
    render(<$COMPONENT_NAME>Test content</$COMPONENT_NAME>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });
});
EOF

echo "✅ Test file created: $TEST_FILE"

# Generate Storybook story if it's a visual component
if [ "$COMPONENT_TYPE" != "common" ]; then
    STORIES_DIR="$VERSION_DIR/src/stories"
    mkdir -p "$STORIES_DIR"
    STORY_FILE="$STORIES_DIR/$COMPONENT_NAME.stories.tsx"

    cat > "$STORY_FILE" << EOF
import type { Meta, StoryObj } from '@storybook/react';
import $COMPONENT_NAME from '../components/$COMPONENT_TYPE/$COMPONENT_NAME';

const meta: Meta<typeof $COMPONENT_NAME> = {
  title: 'Components/$COMPONENT_TYPE/$COMPONENT_NAME',
  component: $COMPONENT_NAME,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    className: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: 'Default $COMPONENT_NAME',
  },
};

export const WithCustomClass: Story = {
  args: {
    children: 'Custom styled $COMPONENT_NAME',
    className: 'custom-styling',
  },
};
EOF

    echo "✅ Storybook story created: $STORY_FILE"
fi

echo ""
echo "🎉 Component $COMPONENT_NAME generated successfully!"
echo ""
echo "Next steps:"
echo "1. Implement your component logic in $COMPONENT_FILE"
echo "2. Update the tests in $TEST_FILE"
echo "3. Add the component to the appropriate index.ts file"
echo "4. Update any parent components that will use this component"
echo ""
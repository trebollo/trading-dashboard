'use client'


import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Card, CardContent } from './ui/card'
import { LayoutGrid, Upload, BarChart3, GitCompare } from 'lucide-react'
import StrategyBuilder from './strategy-builder'
import BacktestImporter from './backtest-importer'
import ResultsViewer from './results-viewer'
import ComparisonView from './comparison-view'

export default function Dashboard() {
  return (
    <div className="container mx-auto px-4 py-6">
      <Tabs defaultValue="builder">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="builder" className="flex items-center gap-2">
            <LayoutGrid className="w-4 h-4" />
            Strategy Builder
          </TabsTrigger>
          <TabsTrigger value="import" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            Import Results
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Results
          </TabsTrigger>
          <TabsTrigger value="compare" className="flex items-center gap-2">
            <GitCompare className="w-4 h-4" />
            Compare
          </TabsTrigger>
        </TabsList>

        <TabsContent value="builder">
          <Card>
            <CardContent className="p-6">
              <StrategyBuilder />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import">
          <Card>
            <CardContent className="p-6">
              <BacktestImporter />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results">
          <Card>
            <CardContent className="p-6">
              <ResultsViewer />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compare">
          <Card>
            <CardContent className="p-6">
              <ComparisonView />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
